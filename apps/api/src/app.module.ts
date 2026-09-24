import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';

import { AppConfigModule } from './config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppLoggerModule } from './common/logging/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ApplicationsModule } from './applications/applications.module';

/**
 * Root module. Order matters: `@nestjs/config` loads the `.env` file into
 * `process.env` first, then `AppConfigModule` validates it with Zod and fails fast
 * (Rulebook §4). The global exception filter is registered here via DI.
 */
@Module({
  imports: [
    // Loads .env (repo root or app-local) into process.env; validation is done by
    // AppConfigModule/Zod, so no schema is duplicated here.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: ['../../.env', '.env'],
    }),
    AppConfigModule.forRoot(),
    AppLoggerModule,
    PrismaModule,
    HealthModule,
    ApplicationsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
