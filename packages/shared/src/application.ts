import { z } from 'zod';
import { IdSchema, IsoDateTimeSchema, timestampsSchema } from './common.js';
import { ActorKindSchema, ApplicationStatusSchema } from './enums.js';

/**
 * Application — a candidate's application to a Job and its pipeline state
 * (REQUIREMENTS FR-6, FR-7). Uniqueness: one application per (user, job).
 *
 * Every automated submission must be logged and reviewable (REQUIREMENTS §4);
 * the immutable audit trail lives in `ApplicationEvent`.
 */
export const ApplicationSchema = timestampsSchema.extend({
  id: IdSchema,
  userId: IdSchema,
  jobId: IdSchema,
  /** Resume version used for this application (FR-2.4). */
  resumeId: IdSchema.nullable().default(null),
  /** Match that produced this application, if any (FR-4). */
  matchId: IdSchema.nullable().default(null),
  status: ApplicationStatusSchema,
  /** Object-storage key for the tailored resume actually submitted (FR-5.1). */
  tailoredResumeKey: z.string().min(1).nullable().default(null),
  /** Object-storage key for the generated cover letter (FR-5.2). */
  coverLetterKey: z.string().min(1).nullable().default(null),
  /** ATS keyword/relevance score shown before applying, 0–100 (FR-5.3). */
  atsRelevanceScore: z.number().min(0).max(100).nullable().default(null),
  /** When the application was actually submitted to the ATS (FR-6.4). */
  submittedAt: IsoDateTimeSchema.nullable().default(null),
  /** Free-text user notes (FR-7.2). */
  notes: z.string().max(4000).nullable().default(null),
});
export type Application = z.infer<typeof ApplicationSchema>;

/**
 * ApplicationEvent — immutable audit record of a status transition or automated
 * action on an application (REQUIREMENTS FR-7, NFR-1 audit log). Append-only.
 */
export const ApplicationEventSchema = z.object({
  id: IdSchema,
  applicationId: IdSchema,
  fromStatus: ApplicationStatusSchema.nullable().default(null),
  toStatus: ApplicationStatusSchema,
  /** Who triggered the transition — the user or the system/automation. */
  actor: ActorKindSchema,
  message: z.string().max(2000).optional(),
  /** Structured context (e.g. ATS response, retry count). Never store PII here. */
  metadata: z.record(z.unknown()).optional(),
  createdAt: IsoDateTimeSchema,
});
export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>;

/** Payload to enqueue a new application (FR-6.1). */
export const CreateApplicationSchema = ApplicationSchema.pick({
  jobId: true,
  resumeId: true,
  matchId: true,
});
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
