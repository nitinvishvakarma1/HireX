import { z } from 'zod';

/**
 * Generic, transport-level building blocks shared by the web and API apps:
 * primitive schemas, the API response envelope, and cursor-based pagination.
 */

/** All entity IDs are UUIDs (Postgres `gen_random_uuid()`). */
export const IdSchema = z.string().uuid();
export type Id = z.infer<typeof IdSchema>;

/** ISO-8601 timestamps are used on the wire (JSON has no Date type). */
export const IsoDateTimeSchema = z.string().datetime();
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

/** Standard created/updated audit fields present on most entities. */
export const timestampsSchema = z.object({
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});
export type Timestamps = z.infer<typeof timestampsSchema>;

/** Money is stored as minor-unit-agnostic decimals plus an ISO-4217 currency code. */
export const MoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
});
export type Money = z.infer<typeof MoneySchema>;

/** A structured, partial location used in preferences and job postings. */
export const LocationSchema = z.object({
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().min(1),
});
export type Location = z.infer<typeof LocationSchema>;

/**
 * Structured error returned to clients. `code` is a stable, machine-readable
 * identifier (e.g. `JOB_NOT_FOUND`); `message` is safe for display (rulebook §5).
 */
export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Optional envelope metadata (request id, timing, etc.). */
export interface ResponseMeta {
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Discriminated response envelope. Forcing callers to check `ok` makes the
 * error path un-ignorable (rulebook §3 — handle every failure).
 */
export type ApiResponse<T> =
  | { ok: true; data: T; meta?: ResponseMeta }
  | { ok: false; error: ApiError; meta?: ResponseMeta };

/** Build a Zod schema for an `ApiResponse<T>` given the success payload schema. */
export const apiResponseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.discriminatedUnion('ok', [
    z.object({
      ok: z.literal(true),
      data,
      meta: z.record(z.unknown()).optional(),
    }),
    z.object({
      ok: z.literal(false),
      error: ApiErrorSchema,
      meta: z.record(z.unknown()).optional(),
    }),
  ]);

/** Convenience constructors for the envelope. */
export const ok = <T>(data: T, meta?: ResponseMeta): ApiResponse<T> => ({
  ok: true,
  data,
  ...(meta ? { meta } : {}),
});

export const fail = <T = never>(
  error: ApiError,
  meta?: ResponseMeta,
): ApiResponse<T> => ({ ok: false, error, ...(meta ? { meta } : {}) });

/**
 * Cursor-based pagination (rulebook §6 — cursor pagination preferred).
 * `nextCursor` is an opaque token; `null` means there are no more items.
 */
export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Build a Zod schema for a `Paginated<T>` given the item schema. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });

/** Standard query parameters for cursor-paginated list endpoints. */
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
