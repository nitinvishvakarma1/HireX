# @hirex/api

NestJS 10 + TypeScript API for HireX — auth, REST orchestration, and the
application pipeline. Follows the repo [Engineering Rulebook](../../docs/ENGINEERING_GUIDELINES.md).

## Prerequisites

- Node >= 20 (repo uses npm workspaces; install from the repo root).
- Redis running locally (`docker compose up -d` at the repo root).
- A Supabase Postgres database and the env below.
- Generated Prisma client (the schema at `prisma/schema.prisma` is owned by
  another agent):

  ```bash
  npm run prisma:generate -w apps/api
  ```

## Install & run

From the repo root:

```bash
npm install
npm run prisma:generate -w apps/api   # generate @prisma/client from prisma/schema.prisma
npm run dev:api                        # watch mode (nest start --watch)
```

Or from `apps/api`:

```bash
npm run start:dev   # dev (watch)
npm run build       # compile to dist/
npm run start       # run compiled dist/main.js
npm run lint        # eslint (0 warnings)
npm run typecheck   # tsc --noEmit
npm run test        # jest unit tests
```

## Configuration

All config comes from the environment, validated with Zod at startup — the process
**fails fast** with a readable error if anything is missing or invalid
(`src/config/configuration.ts`). Never hard-code secrets. Keys mirror the repo-root
[`.env.example`](../../.env.example):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Supabase Postgres connection string. |
| `REDIS_URL` | yes | Redis (cache/queue). |
| `ANTHROPIC_API_KEY` | yes | Claude API key. |
| `STORAGE_S3_ENDPOINT` / `STORAGE_S3_REGION` / `STORAGE_S3_ACCESS_KEY_ID` / `STORAGE_S3_SECRET_ACCESS_KEY` / `STORAGE_BUCKET` | yes | S3-compatible object storage (Supabase Storage). |
| `PORT` | no | HTTP port. Defaults to `3000`. Add to `.env.example` if you override it. |
| `LOG_LEVEL` | no | pino level (`info` by default). |
| `NODE_ENV` | no | `development` \| `test` \| `production`. |

Inject `AppConfigService` for typed access; do not read `process.env` directly.

## Endpoints

- `GET /health` — liveness (public probe).
- `GET /applications` — cursor-paginated list (`?limit=&cursor=&status=`).
- `GET /applications/:id` — single application.
- `POST /applications` — create an application.

Example:

```bash
curl "http://localhost:3000/applications?limit=2" -H "x-user-id: demo-user"
```

## Architecture

Layered and dependency-injected (Rulebook §3):

```
HTTP → Controller (thin, DTO validation) → Service (business logic) → Repository (data access) → Prisma/DB
```

- **Config** (`src/config`) — Zod-validated, typed, fail-fast configuration.
- **Logging** (`src/common/logging`) — structured JSON logs via `nestjs-pino`, with a
  correlation id per request (`x-correlation-id`), secret redaction. No `console.log`.
- **Errors** (`src/common/errors`) — typed domain errors (`AppError`, `NotFoundError`,
  `ValidationError`, …) mapped to HTTP status codes by the global exception filter
  (`src/common/filters`); stack traces and internals are never returned to clients.
- **Pagination** (`src/common/pagination`) — reusable cursor-based pagination.
- **Prisma** (`src/prisma`) — global `PrismaService` (connect/disconnect on lifecycle);
  DB access lives only in repositories.
- **Applications** (`src/applications`) — the reference feature module
  (controller/service/repository/DTOs); copy its structure for new features.

Contracts intended for reuse are marked `TODO(@hirex/shared)` and should move to the
shared package so the frontend imports one source of truth.

## Security notes (must address before launch)

- **Endpoints are currently UNAUTHENTICATED.** `@CurrentUserId()`
  (`src/common/auth/current-user.decorator.ts`) is a placeholder that trusts an
  `x-user-id` header and is spoofable. Replace it with an auth guard (NestJS JWT /
  OAuth per PROJECT_PLAN §4.2) that verifies a token and attaches the principal.
- **CORS** is not configured — set explicit allowed origins from config before the
  frontend integrates (see `main.ts` TODO).
- The applications repository uses a deterministic **in-memory store** until the
  Prisma `Application` model is generated; each method documents the Prisma call to
  swap in (`TODO(prisma)`).
