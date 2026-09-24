import { Controller, Get } from '@nestjs/common';

import { HealthService, HealthStatus } from './health.service';

/** Liveness endpoint. Thin controller (Rulebook §10) — delegates to the service. */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Public by design: liveness probe for load balancers / orchestrators.
  @Get()
  getHealth(): HealthStatus {
    return this.healthService.getLiveness();
  }
}
