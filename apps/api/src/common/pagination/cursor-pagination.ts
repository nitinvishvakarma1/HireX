import { ValidationError } from '../errors';

/**
 * Cursor-based pagination primitives (Rulebook §6: paginate all list endpoints,
 * cursor-based preferred). Cursors are opaque, stable, and encode the sort key
 * of the last returned row so paging is consistent under inserts/deletes.
 */

/** Default page size when the client does not specify one. */
export const DEFAULT_PAGE_SIZE = 20;
/** Hard upper bound on page size to protect the DB and response times. */
export const MAX_PAGE_SIZE = 100;

/** Metadata describing how to fetch the next page. */
export interface CursorPageInfo {
  /** Opaque cursor for the next page, or `null` when there are no more rows. */
  readonly nextCursor: string | null;
  readonly hasNextPage: boolean;
  readonly limit: number;
}

/** A page of results plus paging metadata. */
export interface CursorPage<T> {
  readonly items: T[];
  readonly pageInfo: CursorPageInfo;
}

/** Decoded cursor payload. Ordering is `createdAt` desc, then `id` desc as tiebreak. */
export interface Cursor {
  readonly createdAt: string;
  readonly id: string;
}

/** Any row that can be paginated by (createdAt, id). */
export interface Cursorable {
  readonly id: string;
  readonly createdAt: Date;
}

const CURSOR_SEPARATOR = '::';

/** Encode a cursor to an opaque, URL-safe token. */
export function encodeCursor(cursor: Cursor): string {
  const raw = `${cursor.createdAt}${CURSOR_SEPARATOR}${cursor.id}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

/** Decode an opaque cursor token, throwing a client-safe error if malformed. */
export function decodeCursor(token: string): Cursor {
  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    throw new ValidationError('Invalid pagination cursor.');
  }

  const separatorIndex = decoded.indexOf(CURSOR_SEPARATOR);
  if (separatorIndex === -1) {
    throw new ValidationError('Invalid pagination cursor.');
  }

  const createdAt = decoded.slice(0, separatorIndex);
  const id = decoded.slice(separatorIndex + CURSOR_SEPARATOR.length);
  if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) {
    throw new ValidationError('Invalid pagination cursor.');
  }

  return { createdAt, id };
}

/**
 * Build a {@link CursorPage} from rows fetched with `limit + 1` semantics.
 *
 * Callers fetch one extra row to detect a following page. Pass the raw rows
 * (length up to `limit + 1`); this trims to `limit` and derives the next cursor.
 */
export function buildCursorPage<T extends Cursorable>(
  rows: T[],
  limit: number,
): CursorPage<T> {
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor =
    hasNextPage && last
      ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
      : null;

  return { items, pageInfo: { nextCursor, hasNextPage, limit } };
}
