import { HttpStatus } from '@nestjs/common';

/**
 * Base class for typed, domain-specific errors (Rulebook §5).
 *
 * Domain and service layers throw these instead of raw `Error`s or framework
 * `HttpException`s; the global exception filter maps them to HTTP responses.
 * `message` is safe to show to clients — it must never contain secrets,
 * stack traces, SQL, or other internals.
 */
export abstract class AppError extends Error {
  /** HTTP status this error maps to. */
  abstract readonly statusCode: HttpStatus;
  /** Stable, machine-readable error code for clients/telemetry (e.g. `NOT_FOUND`). */
  abstract readonly code: string;

  /**
   * Operational errors are expected failures (bad input, missing resource) and
   * are logged at `warn`. Non-operational errors indicate bugs (logged `error`).
   */
  readonly isOperational: boolean = true;

  /** Optional structured, client-safe details (e.g. per-field validation errors). */
  readonly details?: Readonly<Record<string, unknown>>;

  protected constructor(
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    // Restore prototype chain when targeting ES5/ES2022 with transpiled classes.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Requested resource does not exist → 404. */
export class NotFoundError extends AppError {
  readonly statusCode = HttpStatus.NOT_FOUND;
  readonly code = 'NOT_FOUND';

  constructor(resource: string, id?: string | number) {
    super(
      id === undefined
        ? `${resource} not found.`
        : `${resource} with id "${id}" not found.`,
    );
  }
}

/** Input failed a domain/business rule → 400. */
export class ValidationError extends AppError {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

/** State conflict (e.g. duplicate, invalid transition) → 409. */
export class ConflictError extends AppError {
  readonly statusCode = HttpStatus.CONFLICT;
  readonly code = 'CONFLICT';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

/** Caller is not authenticated → 401. */
export class UnauthorizedError extends AppError {
  readonly statusCode = HttpStatus.UNAUTHORIZED;
  readonly code = 'UNAUTHORIZED';

  constructor(message = 'Authentication required.') {
    super(message);
  }
}

/** Caller is authenticated but not permitted → 403. */
export class ForbiddenError extends AppError {
  readonly statusCode = HttpStatus.FORBIDDEN;
  readonly code = 'FORBIDDEN';

  constructor(message = 'You do not have access to this resource.') {
    super(message);
  }
}
