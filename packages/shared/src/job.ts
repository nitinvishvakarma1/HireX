import { z } from 'zod';
import {
  IdSchema,
  IsoDateTimeSchema,
  LocationSchema,
  timestampsSchema,
} from './common.js';
import {
  EmploymentTypeSchema,
  RemotePolicySchema,
  SeniorityLevelSchema,
} from './enums.js';

/**
 * Job — an open role discovered via an ATS/job-board integration
 * (REQUIREMENTS FR-4). Deduplicated by (`source`, `sourceJobId`).
 *
 * Semantic matching: the DB row carries a `vector(1536)` embedding column
 * (pgvector) that is NOT exposed on this wire DTO — see prisma/schema.prisma.
 */
export const SalaryRangeSchema = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('USD'),
});
export type SalaryRange = z.infer<typeof SalaryRangeSchema>;

export const JobSchema = timestampsSchema.extend({
  id: IdSchema,
  companyId: IdSchema,
  title: z.string().min(1).max(300),
  description: z.string().min(1),
  employmentType: EmploymentTypeSchema.optional(),
  seniority: SeniorityLevelSchema.optional(),
  remotePolicy: RemotePolicySchema.optional(),
  location: LocationSchema.optional(),
  salary: SalaryRangeSchema.optional(),
  skills: z.array(z.string().min(1)).default([]),
  /** Integration the job came from (e.g. `greenhouse`, `lever`, `indeed`). */
  source: z.string().min(1),
  /** The job's identifier within that source; unique per source. */
  sourceJobId: z.string().min(1),
  /** Canonical apply/details URL on the source. */
  url: z.string().url().optional(),
  postedAt: IsoDateTimeSchema.optional(),
});
export type Job = z.infer<typeof JobSchema>;

/** Payload used by integrations to upsert a discovered job. */
export const UpsertJobSchema = JobSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type UpsertJobInput = z.infer<typeof UpsertJobSchema>;
