import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';

import { AppError } from '../errors';

/** Shape of every error response returned to clients. Never includes internals. */
interface ErrorResponseBody {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly correlationId: string;
  readonly path: string;
  readonly timestamp: string;
}

/**
 * Global exception filter (Rulebook §5).
 *
 * Maps typed domain errors ({@link AppError}) and framework `HttpException`s to
 * safe HTTP responses, and treats everything else as a 500 without leaking the
 * stack trace, SQL, or secrets. All errors are logged (with the correlation id)
 * via the structured logger — operational errors at `warn`, bugs at `error`.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { id?: string }>();

    const correlationId = request.id ?? 'unknown';
    const path = httpAdapter.getRequestUrl(request) as string;

    const { statusCode, code, message, details, isServerError } =
      this.describe(exception);

    // Log full detail server-side only; clients never see the stack.
    const logPayload = { err: exception, correlationId, path, code, statusCode };
    if (isServerError) {
      this.logger.error(logPayload, `Unhandled error: ${message}`);
    } else {
      this.logger.warn(logPayload, `Request failed: ${message}`);
    }

    const body: ErrorResponseBody = {
      statusCode,
      code,
      message,
      ...(details ? { details } : {}),
      correlationId,
      path,
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse<Response>(), body, statusCode);
  }

  private describe(exception: unknown): {
    statusCode: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    isServerError: boolean;
  } {
    if (exception instanceof AppError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details as Record<string, unknown> | undefined,
        isServerError: exception.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      // `class-validator` / ValidationPipe put messages in `response.message`.
      const message =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | string[] }).message ??
            exception.message);
      return {
        statusCode: status,
        code: this.statusToCode(status),
        message: Array.isArray(message) ? message.join('; ') : message,
        isServerError: status >= HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }

    // Unknown/unexpected: do not leak details to the client.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      isServerError: true,
    };
  }

  private statusToCode(status: number): string {
    const known: Partial<Record<HttpStatus, string>> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };
    return known[status as HttpStatus] ?? `HTTP_${status}`;
  }
}
