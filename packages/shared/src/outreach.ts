import { z } from 'zod';
import { IdSchema, IsoDateTimeSchema, timestampsSchema } from './common.js';
import {
  OutreachChannelSchema,
  OutreachStatusSchema,
  SuppressionReasonSchema,
} from './enums.js';

/**
 * OutreachLog — a record of every outbound message sent on a user's behalf
 * (PLAN §5, REQUIREMENTS FR-9). Outreach is opt-in, personalized, and
 * rate-limited — never bulk. Each send is logged for compliance and
 * deliverability monitoring (NFR-6).
 *
 * PII: `recipientEmail`. Handle per compliance; never log the raw value.
 */
export const OutreachLogSchema = timestampsSchema.extend({
  id: IdSchema,
  /** The HireX user this outreach was sent for. */
  userId: IdSchema.nullable().default(null),
  /** Related application, when the outreach concerns a specific application. */
  applicationId: IdSchema.nullable().default(null),
  channel: OutreachChannelSchema,
  /** PII. Recipient address; MUST be checked against the suppression list first. */
  recipientEmail: z.string().email(),
  subject: z.string().max(300).optional(),
  status: OutreachStatusSchema,
  /** Provider-side message id for delivery/complaint reconciliation. */
  providerMessageId: z.string().min(1).nullable().default(null),
  /** Per-message unsubscribe token embedded in the one-click unsubscribe link. */
  unsubscribeToken: z.string().min(1).nullable().default(null),
  sentAt: IsoDateTimeSchema.nullable().default(null),
  /** Safe, non-sensitive failure reason when status is FAILED/BOUNCED. */
  error: z.string().max(1000).nullable().default(null),
});
export type OutreachLog = z.infer<typeof OutreachLogSchema>;

/**
 * SuppressionEntry — the global do-not-contact list (PLAN §5.2, §5.3).
 * `email` is unique and honored across ALL outreach; unsubscribes and bounces
 * land here and are checked before every send (CAN-SPAM/GDPR/CASL compliance).
 */
export const SuppressionEntrySchema = z.object({
  id: IdSchema,
  /** PII. Unique, normalized (lower-cased) email address. */
  email: z.string().email(),
  reason: SuppressionReasonSchema,
  /** Where the suppression originated (e.g. `unsubscribe-link`, `postmark-bounce`). */
  source: z.string().min(1).optional(),
  createdAt: IsoDateTimeSchema,
});
export type SuppressionEntry = z.infer<typeof SuppressionEntrySchema>;
