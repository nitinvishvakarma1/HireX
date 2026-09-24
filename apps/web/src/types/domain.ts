/**
 * Domain types for the HireX web app.
 *
 * TODO(shared-types): These are minimal local mirrors of the canonical domain
 * model. Once the `@hirex/shared` workspace package publishes the shared DTOs
 * (see docs/ENGINEERING_GUIDELINES.md §3 "shared code lives in shared places"),
 * delete these and re-export from "@hirex/shared" so the frontend and NestJS API
 * share one source of truth:
 *
 *   export type { Match, Application, ApplicationStatus } from "@hirex/shared";
 */

/** Where an application currently sits in the pipeline (PROJECT_PLAN §3). */
export type ApplicationStatus =
  | "matched"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

export type WorkArrangement = "remote" | "hybrid" | "onsite";

/** A ranked job opportunity surfaced by the matching engine. */
export interface Match {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  workArrangement: WorkArrangement;
  /** Explainable fit score, 0–100 (PROJECT_PLAN §3 "explainable match score"). */
  matchScore: number;
  salaryRange: string | null;
  /** ISO-8601 timestamp of when the role was discovered. */
  discoveredAt: string;
  /** Short human-readable reasons the role scored well. */
  matchReasons: string[];
}

/** A tracked application in the candidate's pipeline. */
export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: ApplicationStatus;
  /** ISO-8601 timestamp of the last status change. */
  lastUpdatedAt: string;
  /** ISO-8601 timestamp of when the application was submitted, if it has been. */
  submittedAt: string | null;
  source: string;
}

/** Standard shape for a paginated list response from the HireX API. */
export interface Paginated<TItem> {
  items: TItem[];
  nextCursor: string | null;
  total: number;
}
