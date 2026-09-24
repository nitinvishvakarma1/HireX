import { z } from 'zod';
import { IdSchema, LocationSchema, timestampsSchema } from './common.js';
import { RemotePolicySchema, SeniorityLevelSchema } from './enums.js';

/**
 * CandidateProfile — a user's job-search preferences and derived profile
 * (REQUIREMENTS FR-2, FR-3). One profile per user.
 *
 * PII: `headline`, `summary`, and free-text fields may contain personal data.
 * The semantic-matching embedding lives on the DB row (pgvector column) and is
 * intentionally NOT part of this wire DTO — see prisma/schema.prisma.
 */
export const SalaryExpectationSchema = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('USD'),
});
export type SalaryExpectation = z.infer<typeof SalaryExpectationSchema>;

export const CandidateProfileSchema = timestampsSchema.extend({
  id: IdSchema,
  userId: IdSchema,
  /** PII. Short professional headline. */
  headline: z.string().max(200).optional(),
  /** PII. Longer professional summary. */
  summary: z.string().max(4000).optional(),
  skills: z.array(z.string().min(1)).default([]),
  yearsOfExperience: z.number().int().nonnegative().max(80).optional(),
  seniority: SeniorityLevelSchema.optional(),
  targetRoles: z.array(z.string().min(1)).default([]),
  targetIndustries: z.array(z.string().min(1)).default([]),
  locations: z.array(LocationSchema).default([]),
  remotePolicies: z.array(RemotePolicySchema).default([]),
  salary: SalaryExpectationSchema.optional(),
  mustHaves: z.array(z.string().min(1)).default([]),
  dealBreakers: z.array(z.string().min(1)).default([]),
  /**
   * Auto-approve confidence threshold (0–100). `null` means auto-approve is off,
   * which is the default (REQUIREMENTS FR-3.4). A magic number would violate
   * rulebook §4 — the app supplies the default explicitly.
   */
  autoApproveThreshold: z.number().min(0).max(100).nullable().default(null),
});
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

/** Editable subset for profile create/update (server owns id/userId/timestamps). */
export const UpsertCandidateProfileSchema = CandidateProfileSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();
export type UpsertCandidateProfileInput = z.infer<
  typeof UpsertCandidateProfileSchema
>;
