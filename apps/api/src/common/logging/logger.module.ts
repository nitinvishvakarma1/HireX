import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { AppConfigModule, AppConfigService } from '../../config';

type RequestWithId = IncomingMessage & { id?: string };

const CORRELATION_ID_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Structured JSON logging (Rulebook §9) via `nestjs-pino`.
 *
 * - Every log line carries a correlation/request id (`req.id`), taken from the
 *   inbound `x-correlation-id`/`x-request-id` header or generated per request.
 * - Secrets (auth headers, cookies) are redacted; PII is never logged wholesale.
 * - Pretty transport in development; raw JSON in test/production for log shippers.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          // Correlation id: reuse an inbound id or mint one, and echo it back.
          genReqId: (req: IncomingMessage, res: ServerResponse): string => {
            const existing =
              (req.headers[CORRELATION_ID_HEADER] as string | undefined) ??
              (req.headers[REQUEST_ID_HEADER] as string | undefined);
            const id = existing ?? randomUUID();
            res.setHeader(CORRELATION_ID_HEADER, id);
            return id;
          },
          customProps: (req: IncomingMessage) => ({
            correlationId: (req as RequestWithId).id,
          }),
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-api-key"]',
              'res.headers["set-cookie"]',
            ],
            remove: true,
          },
          transport: config.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'SYS:standard' },
              },
        },
      }),
    }),
  ],
})
export class AppLoggerModule {}
