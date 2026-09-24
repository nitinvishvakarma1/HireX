import { Module } from '@nestjs/common';

import { ApplicationsController } from './applications.controller';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';

/**
 * Applications feature module — the reference example wiring controller → service →
 * repository (Rulebook §3). Copy this structure for future feature modules.
 */
@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
