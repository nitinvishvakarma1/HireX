import { z } from 'zod';
import { IdSchema, timestampsSchema } from './common.js';
import { MatchReasonKindSchema } from './enums.js';

/**
 * Match — an explainable ranking of a Job for a candidate (REQUIREMENTS FR-4.2,
 * FR-4.3). `score` is 0–100; `reasons` explain *why* the job matched so the UI
 * can surface skills/location/seniority overlap.
 */
export const MatchReasonSchema = z.object({
  kind: MatchReasonKindSchema,
  /** Human-readable explanation, e.g. "5 of 7 required skills overlap". */
  detail: z.string().min(1),
  /** Optional relative contribution of this reason to the score (0–1). */
  weight: z.number().min(0).max(1).optional(),
});
export type MatchReason = z.infer<typeof MatchReasonSchema>;

export const MatchSchema = timestampsSchema.extend({
  id: IdSchema,
  userId: IdSchema,
  jobId: IdSchema,
  candidateProfileId: IdSchema,
  /** Explainable match score, 0–100 (REQUIREMENTS FR-4.2). */
  score: z.number().min(0).max(100),
  reasons: z.array(MatchReasonSchema).default([]),
  /** Whether the user saved or dismissed the match (REQUIREMENTS FR-4.5). */
  dismissedAt: z.string().datetime().nullable().default(null),
  savedAt: z.string().datetime().nullable().default(null),
});
export type Match = z.infer<typeof MatchSchema>;
