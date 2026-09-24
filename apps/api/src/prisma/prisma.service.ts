import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

import { AppConfigService } from '../config';

/**
 * Prisma database client (Rulebook §12: DB access only through the repository
 * layer, which depends on this service).
 *
 * NOTE: the Prisma schema lives at `prisma/schema.prisma` and is owned by another
 * agent. Run `npm run prisma:generate` (or `prisma generate`) before building so
 * `@prisma/client` is generated — otherwise `PrismaClient` has no typed models.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly config: AppConfigService,
    private readonly logger: PinoLogger,
  ) {
    super({
      datasources: { db: { url: config.database.url } },
      log: config.isProduction
        ? [{ emit: 'stdout', level: 'warn' }]
        : [{ emit: 'stdout', level: 'query' }],
    });
    this.logger.setContext(PrismaService.name);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.info('Prisma connected to the database.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.info('Prisma disconnected from the database.');
  }
}
