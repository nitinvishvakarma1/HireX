import { z } from 'zod';
import { IdSchema, timestampsSchema } from './common.js';
import { OAuthProviderSchema } from './enums.js';

/**
 * User — an authenticated account holder (REQUIREMENTS FR-1).
 *
 * PII: `email`, `displayName`. Handle per compliance (encryption at rest,
 * export & erasure — PLAN §5.2, NFR-1/NFR-2). Never log these fields.
 */
export const UserSchema = timestampsSchema.extend({
  id: IdSchema,
  /** PII. Primary login identifier; unique across users. */
  email: z.string().email(),
  /** PII. Optional human-friendly name. */
  displayName: z.string().min(1).max(120).optional(),
  emailVerified: z.boolean().default(false),
  /** OAuth providers this account has linked (email/password users may have none). */
  linkedProviders: z.array(OAuthProviderSchema).default([]),
});
export type User = z.infer<typeof UserSchema>;

/** Fields a client may supply when creating a user (server owns id/timestamps). */
export const CreateUserSchema = UserSchema.pick({
  email: true,
  displayName: true,
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
