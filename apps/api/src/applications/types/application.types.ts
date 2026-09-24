/**
 * Domain types for the applications feature.
 *
 * TODO(@hirex/shared): these request/response contracts should live in the shared
 * `@hirex/shared` package so the Next.js frontend and this API import one source of
 * truth (Rulebook §3). Defined locally for now because that package is not yet
 * available; move them and re-export when it exists.
 */

/** Pipeline stages for a job application (Requirements FR-7.1). */
export enum ApplicationStatus {
  Matched = 'matched',
  Applied = 'applied',
  Screening = 'screening',
  Interview = 'interview',
  Offer = 'offer',
  Rejected = 'rejected',
}

export const APPLICATION_STATUSES: readonly ApplicationStatus[] =
  Object.values(ApplicationStatus);

/**
 * Core application entity. Mirrors the intended Prisma `Application` model so the
 * in-memory repository can be swapped for real Prisma access with no API change.
 */
export interface Application {
  readonly id: string;
  /** Owning user (multi-tenancy scope — Rulebook §7). */
  readonly userId: string;
  readonly jobId: string;
  readonly company: string;
  readonly roleTitle: string;
  readonly status: ApplicationStatus;
  /** Explainable match score, 0..100 (Requirements FR-4.2). */
  readonly matchScore: number;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Fields required to create an application (service-layer input). */
export interface CreateApplicationInput {
  readonly userId: string;
  readonly jobId: string;
  readonly company: string;
  readonly roleTitle: string;
  readonly matchScore: number;
  readonly status?: ApplicationStatus;
  readonly notes?: string | null;
}

/** Filters supported by the list query, in addition to cursor pagination. */
export interface ListApplicationsFilter {
  readonly userId: string;
  readonly status?: ApplicationStatus;
}
