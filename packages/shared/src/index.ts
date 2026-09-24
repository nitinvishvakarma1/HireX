/**
 * @hirex/shared — the single source of truth for domain types, DTOs, enums, and
 * Zod validation schemas reused by the HireX web (Next.js) and API (NestJS) apps.
 *
 * Everything is exported from here so consumers import from `@hirex/shared`
 * rather than reaching into individual files.
 */

// Transport primitives: ApiResponse<T>, Paginated<T>, Location, Money, pagination.
export * from './common.js';

// Shared enumerations (values + Zod schemas + inferred union types).
export * from './enums.js';

// Domain entities and their DTOs.
export * from './user.js';
export * from './candidate.js';
export * from './resume.js';
export * from './company.js';
export * from './job.js';
export * from './match.js';
export * from './application.js';
export * from './outreach.js';
