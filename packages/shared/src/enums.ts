import { z } from 'zod';

/**
 * Shared enumerations for the HireX domain.
 *
 * Each enum is defined once as a `const` tuple (the single source of truth for its
 * runtime values), wrapped in a Zod schema for boundary validation, and exposed as an
 * inferred string-literal union type. This keeps runtime values and static types in
 * lockstep and avoids TS `enum` (which is awkward under `isolatedModules`).
 */

/** Application pipeline status (Kanban stages — REQUIREMENTS FR-7.1). */
export const APPLICATION_STATUSES = [
  'MATCHED',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
] as const;
export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

/** Who or what triggered a state change (audit trail). */
export const ACTOR_KINDS = ['USER', 'SYSTEM'] as const;
export const ActorKindSchema = z.enum(ACTOR_KINDS);
export type ActorKind = z.infer<typeof ActorKindSchema>;

/** Seniority levels used for preferences and job classification. */
export const SENIORITY_LEVELS = [
  'INTERN',
  'ENTRY',
  'JUNIOR',
  'MID',
  'SENIOR',
  'LEAD',
  'PRINCIPAL',
  'EXECUTIVE',
] as const;
export const SeniorityLevelSchema = z.enum(SENIORITY_LEVELS);
export type SeniorityLevel = z.infer<typeof SeniorityLevelSchema>;

/** Employment arrangement for a job. */
export const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'TEMPORARY',
] as const;
export const EmploymentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

/** Remote/hybrid/onsite policy (REQUIREMENTS FR-3.2). */
export const REMOTE_POLICIES = ['REMOTE', 'HYBRID', 'ONSITE'] as const;
export const RemotePolicySchema = z.enum(REMOTE_POLICIES);
export type RemotePolicy = z.infer<typeof RemotePolicySchema>;

/** Supported OAuth identity providers (REQUIREMENTS FR-1.1). */
export const OAUTH_PROVIDERS = ['GOOGLE', 'LINKEDIN'] as const;
export const OAuthProviderSchema = z.enum(OAUTH_PROVIDERS);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

/** Uploaded resume file formats (REQUIREMENTS FR-2.1). */
export const RESUME_FILE_TYPES = ['PDF', 'DOCX'] as const;
export const ResumeFileTypeSchema = z.enum(RESUME_FILE_TYPES);
export type ResumeFileType = z.infer<typeof ResumeFileTypeSchema>;

/** Explainable match-reason categories (REQUIREMENTS FR-4.3). */
export const MATCH_REASON_KINDS = [
  'SKILL',
  'TITLE',
  'SENIORITY',
  'LOCATION',
  'SALARY',
  'INDUSTRY',
  'SEMANTIC',
] as const;
export const MatchReasonKindSchema = z.enum(MATCH_REASON_KINDS);
export type MatchReasonKind = z.infer<typeof MatchReasonKindSchema>;

/** Outbound outreach channels (email only for now — PLAN §5). */
export const OUTREACH_CHANNELS = ['EMAIL'] as const;
export const OutreachChannelSchema = z.enum(OUTREACH_CHANNELS);
export type OutreachChannel = z.infer<typeof OutreachChannelSchema>;

/** Delivery lifecycle of an outreach message (compliance/observability). */
export const OUTREACH_STATUSES = [
  'QUEUED',
  'SENT',
  'DELIVERED',
  'BOUNCED',
  'COMPLAINED',
  'FAILED',
  'SUPPRESSED',
  'UNSUBSCRIBED',
] as const;
export const OutreachStatusSchema = z.enum(OUTREACH_STATUSES);
export type OutreachStatus = z.infer<typeof OutreachStatusSchema>;

/** Why an email is on the global suppression list (PLAN §5, CAN-SPAM/GDPR/CASL). */
export const SUPPRESSION_REASONS = [
  'UNSUBSCRIBE',
  'BOUNCE',
  'COMPLAINT',
  'MANUAL',
] as const;
export const SuppressionReasonSchema = z.enum(SUPPRESSION_REASONS);
export type SuppressionReason = z.infer<typeof SuppressionReasonSchema>;

/** Notification digest cadence (REQUIREMENTS FR-8.2). */
export const DIGEST_FREQUENCIES = ['OFF', 'DAILY', 'WEEKLY'] as const;
export const DigestFrequencySchema = z.enum(DIGEST_FREQUENCIES);
export type DigestFrequency = z.infer<typeof DigestFrequencySchema>;
