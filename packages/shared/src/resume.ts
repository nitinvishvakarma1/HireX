import { z } from 'zod';
import { IdSchema, timestampsSchema } from './common.js';
import { ResumeFileTypeSchema } from './enums.js';

/**
 * ParsedResume — the structured profile extracted from an uploaded file
 * (REQUIREMENTS FR-2.2, FR-2.3). Kept loose/optional because parsing is
 * best-effort and user-correctable; stored as `jsonb` on the DB row.
 */
export const ParsedResumeExperienceSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export const ParsedResumeSchema = z.object({
  skills: z.array(z.string()).default([]),
  titles: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  experience: z.array(ParsedResumeExperienceSchema).default([]),
});
export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

/**
 * Resume — an uploaded document and its parsed content (REQUIREMENTS FR-2).
 * Users may keep multiple versions (FR-2.4); exactly one is `isPrimary`.
 *
 * PII: the underlying file and `parsed` content are highly sensitive. The file
 * itself is stored encrypted in object storage; only `storageKey` is persisted
 * here (never the raw bytes). Never log `parsed` or `storageKey`.
 */
export const ResumeSchema = timestampsSchema.extend({
  id: IdSchema,
  userId: IdSchema,
  label: z.string().min(1).max(120),
  fileType: ResumeFileTypeSchema,
  /** Opaque object-storage key (bucket-relative path); the file is encrypted at rest. */
  storageKey: z.string().min(1),
  sizeBytes: z.number().int().positive().optional(),
  isPrimary: z.boolean().default(false),
  parsed: ParsedResumeSchema.nullable().default(null),
});
export type Resume = z.infer<typeof ResumeSchema>;

/** Metadata a client supplies when registering an uploaded resume. */
export const CreateResumeSchema = ResumeSchema.pick({
  label: true,
  fileType: true,
  storageKey: true,
  sizeBytes: true,
  isPrimary: true,
});
export type CreateResumeInput = z.infer<typeof CreateResumeSchema>;
