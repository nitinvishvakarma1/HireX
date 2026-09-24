# @hirex/shared

Shared domain types, DTOs, enumerations, and [Zod](https://zod.dev) validation
schemas for HireX. This package is the **single source of truth** for the
contracts exchanged between the web (Next.js) and API (NestJS) apps, so a type or
enum is defined exactly once and reused everywhere (rulebook §3).

## Install / use

It is an internal npm workspace package — depend on it from another workspace:

```jsonc
// apps/api/package.json (or apps/web/package.json)
{
  "dependencies": {
    "@hirex/shared": "*"
  }
}
```

```ts
import {
  type Job,
  JobSchema,
  ApplicationStatus,
  type ApiResponse,
  type Paginated,
  paginatedSchema,
  ok,
  fail,
} from '@hirex/shared';
```

The package's `main`/`exports` point at `src/index.ts` (TypeScript source).
Consuming apps compile it as part of their own build (Next.js `transpilePackages`,
NestJS via the monorepo `tsconfig`). Running `npm run build` also emits compiled
JS + declaration files to `dist/` for tooling that prefers built output.

## What's inside

| Area | Exports |
|------|---------|
| Envelope & pagination | `ApiResponse<T>`, `ApiError`, `ok()`, `fail()`, `Paginated<T>`, `paginatedSchema()`, `PaginationQuery` |
| Primitives | `Id`, `IsoDateTime`, `Location`, `Money`, `timestampsSchema` |
| Enums | `ApplicationStatus`, `SeniorityLevel`, `EmploymentType`, `RemotePolicy`, `OAuthProvider`, `MatchReasonKind`, `OutreachStatus`, `SuppressionReason`, `DigestFrequency`, … |
| Entities | `User`, `CandidateProfile`, `Resume`, `Company`, `Job`, `Match`, `Application`, `ApplicationEvent`, `OutreachLog`, `SuppressionEntry` |

Each entity ships an inferred TypeScript type **and** a matching Zod schema
(e.g. `Job` + `JobSchema`) plus focused create/upsert DTOs. Validate all input at
the boundary with the schema, then work with the inferred type (rulebook §5).

## Conventions

- **Enums** are declared once as a `const` tuple, wrapped in `z.enum`, and exported
  as an inferred string-literal union — runtime values and types stay in lockstep.
- **Timestamps/dates** are ISO-8601 strings on the wire (JSON has no `Date`).
- **PII** fields (email, resume content, names, recipient addresses) are flagged in
  each file's doc comments — never log them; handle per PLAN §5 compliance rules.
- **Embeddings** (`vector(1536)`) live only on the database rows, never on these
  wire DTOs — see [`prisma/schema.prisma`](../../prisma/schema.prisma).

## Scripts

```bash
npm run build      # tsc -> dist/ (JS + .d.ts)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint src
```
