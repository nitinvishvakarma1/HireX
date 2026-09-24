import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { AppConfigService } from './config';

/**
 * Application entrypoint (Rulebook §10).
 *
 * - Structured logger (`nestjs-pino`) replaces the default Nest logger.
 * - Global `ValidationPipe` with whitelisting rejects unknown/invalid input at the
 *   boundary (Rulebook §5).
 * - Global exception filter is registered via DI in `AppModule`.
 * - Shutdown hooks enable graceful teardown (Prisma disconnect, drain).
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Buffer logs until the pino logger is attached so startup logs are structured.
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs();

  const config = app.get(AppConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Graceful shutdown: triggers OnModuleDestroy hooks (e.g. Prisma $disconnect).
  app.enableShutdownHooks();

  // TODO(security): configure CORS explicitly (allowed origins from config) once the
  // frontend origin is known; do not enable a wildcard in production.

  await app.listen(config.port, '0.0.0.0');
  logger.log(
    `@hirex/api listening on http://0.0.0.0:${config.port} [${config.nodeEnv}]`,
  );
}

// Top-level failures must crash the process visibly, not hang silently.
void bootstrap().catch((error) => {
  // Logger may not be up yet if config/bootstrap failed — use stderr as last resort.
  // eslint-disable-next-line no-console
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
