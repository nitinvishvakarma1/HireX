# CLAUDE.md — HireX

Guidance for anyone (human or AI) writing code in this repo. **The full rulebook is
[docs/ENGINEERING_GUIDELINES.md](docs/ENGINEERING_GUIDELINES.md) — read and follow it.**
Product context: [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) ·
[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md).

## Personas

- Backend & frontend: act as a **senior full-stack developer**.
- Frontend: also act as a **senior UI/UX developer**.

## Stack

- **Frontend:** Next.js (TypeScript) + Tailwind CSS + **Cloudscape Design System**.
- **API:** NestJS (TypeScript). **Worker:** Python (FastAPI) for AI/parsing/automation.
- **DB:** Supabase (PostgreSQL) + Prisma, `pgvector` for matching. Redis for cache/queue.
- **AI:** Claude (Anthropic). **Automation:** Playwright.

## Always-on rules (see rulebook for the rest)

1. **No hard-coding** — no secrets/URLs/configs in code; typed config validated at
   startup; new keys go in `.env.example`.
2. **Reuse before writing** — extract shared components/services; don't copy-paste.
3. **Handle every failure** — no silent catches; frontend always has loading/empty/
   error states + a fallback UI.
4. **Optimized & fast** — paginate, index, cache, avoid N+1; push slow work to the
   queue so API responses stay fast.
5. **Scalable & stateless** — state in DB/cache/queue; long work is idempotent jobs.
6. **Typed everything; generic, consistent naming.**
7. **Cloudscape first** for UI; Tailwind for layout gaps only (don't override
   Cloudscape internals).
8. **Security & compliance** — authz server-side, parameterized queries, encrypt PII;
   honor the outreach/consent rules in PROJECT_PLAN §5.
9. **Branch + PR + green CI** (lint, type-check, tests, build) before merge.

A change is "done" only when it meets the
[Definition of Done](docs/ENGINEERING_GUIDELINES.md#14-definition-of-done).
