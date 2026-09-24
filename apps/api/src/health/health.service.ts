import { Injectable } from '@nestjs/common';

/** Liveness snapshot returned by the health endpoint. */
export interface HealthStatus {
  readonly status: 'ok';
  readonly service: string;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
}

/**
 * Basic liveness reporting. Kept dependency-free so `/health` answers even when
 * downstreams (DB, Redis) are degraded. Readiness/deep checks can be added as a
 * separate endpoint later.
 */
@Injectable()
export class HealthService {
  private static readonly SERVICE_NAME = '@hirex/api';

  getLiveness(): HealthStatus {
    return {
      status: 'ok',
      service: HealthService.SERVICE_NAME,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
