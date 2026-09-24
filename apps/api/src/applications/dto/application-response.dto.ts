import { ApplicationStatus, Application } from '../types/application.types';

/**
 * API response shape for an application. Explicitly mapped from the domain entity
 * so internal fields never leak and dates serialize as ISO strings.
 *
 * TODO(@hirex/shared): share this contract with the frontend via `@hirex/shared`.
 */
export interface ApplicationResponseDto {
  readonly id: string;
  readonly jobId: string;
  readonly company: string;
  readonly roleTitle: string;
  readonly status: ApplicationStatus;
  readonly matchScore: number;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Map a domain {@link Application} to its client-facing DTO. */
export function toApplicationResponse(
  application: Application,
): ApplicationResponseDto {
  return {
    id: application.id,
    jobId: application.jobId,
    company: application.company,
    roleTitle: application.roleTitle,
    status: application.status,
    matchScore: application.matchScore,
    notes: application.notes,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
