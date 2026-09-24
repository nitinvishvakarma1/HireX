import { z } from 'zod';
import { IdSchema, LocationSchema, timestampsSchema } from './common.js';

/**
 * Company — an employer that owns one or more job postings
 * (REQUIREMENTS FR-4). Deduplicated by `domain` where known.
 */
export const CompanySchema = timestampsSchema.extend({
  id: IdSchema,
  name: z.string().min(1).max(200),
  /** Canonical website URL. */
  website: z.string().url().optional(),
  /** Registrable domain (e.g. `acme.com`); used to dedupe companies. */
  domain: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  location: LocationSchema.optional(),
  description: z.string().max(4000).optional(),
});
export type Company = z.infer<typeof CompanySchema>;

export const CreateCompanySchema = CompanySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
