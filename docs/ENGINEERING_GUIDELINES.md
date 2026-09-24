# HireX — Engineering Rulebook

> The rules every contributor (human or AI) follows when writing code for HireX.
> Companion to [PROJECT_PLAN.md](PROJECT_PLAN.md) and [REQUIREMENTS.md](REQUIREMENTS.md).
> Last updated: 2026-09-24.

## How to use this

- These are **defaults, not dogma.** If you deviate, say why in the PR.
- Applies to **frontend and backend** unless a section says otherwise.
- A change is not "done" until it meets the [Definition of Done](#10-definition-of-done).

## 0. Personas to embody

- **Backend & frontend:** act as an experienced **senior full-stack developer** —
  reusable, optimized, scalable, well-handled code; nothing hard-coded.
- **Frontend:** additionally act as an experienced **UI/UX developer** — reusable
  components, graceful fallback UI, accessibility, and a considered user experience.

## 1. Golden rules

1. **No hard-coding.** No credentials, secrets, URLs, or environment-specific values
   in code. Everything comes from validated configuration (§4).
2. **Reuse before you write.** Search for an existing utility/component/service first;
   extract a shared one rather than copy-pasting (§3).
3. **Handle every failure path.** No silent catches, no unhandled rejections; every
   user-facing failure has a fallback (§5).
4. **Optimize for reads and hot paths.** Paginate, index, cache, avoid N+1 (§6).
5. **Design stateless & horizontally scalable.** State lives in the DB/cache/queue (§7).
6. **Type everything, name things generically and consistently** (§2).
7. **Tests and CI must be green** before merge (§9, §14).

## 2. Code quality, style & naming

- **One language style per layer:** TypeScript (strict) for Next.js + NestJS; typed
  Python (type hints + `mypy`/`pyright`) for the worker.
- **Formatters/linters are non-negotiable and run in CI:** Prettier + ESLint (TS),
  Ruff + Black (Python). No lint errors on merge.
- **Small, single-responsibility units.** Functions do one thing; files stay focused.
- **Naming — generic, intention-revealing, consistent:**
  - `camelCase` for TS variables/functions, `PascalCase` for types/classes/React
    components, `UPPER_SNAKE_CASE` for constants, `snake_case` for Python and DB columns.
  - Name by role, not implementation: `jobMatchService`, not `theThingThatMatches`.
  - Booleans read as predicates: `isActive`, `hasResume`, `canApply`.
  - Avoid abbreviations and domain jargon in shared code.
- **No dead code, no commented-out blocks, no `console.log` in committed code**
  (use the logger, §9).
- **Comments explain _why_, not _what_.** Prefer self-documenting code.

## 3. Reusability & architecture

- **DRY with judgment:** extract a shared helper/component/service on the *second*
  occurrence; don't over-abstract on the first.
- **Layered, dependency-injected architecture** (esp. backend): controllers/routes →
  services (business logic) → repositories (data). No business logic in controllers;
  no DB calls in controllers.
- **Depend on interfaces, not concretions** for anything external (email provider,
  ATS integration, LLM, storage) so implementations are swappable and testable.
- **Shared code lives in shared places:** a `packages/`-style shared lib (types, DTOs,
  validation schemas) reused across frontend and backend in the monorepo.
- **Feature-first folder structure**; colocate a feature's code, tests, and types.

## 4. Configuration & secrets (dynamic, never hard-coded)

- **All config via environment**, loaded through a single typed config module that
  **validates at startup** (e.g. Zod for TS, Pydantic Settings for Python) and fails
  fast on missing/invalid values.
- **Never commit secrets.** Provide a committed `.env.example` with keys and dummy
  values; real `.env` is git-ignored. Secrets in a manager (Doppler / AWS Secrets
  Manager / Vault) in deployed environments.
- **No magic numbers/strings.** Timeouts, page sizes, rate limits, feature flags,
  thresholds (e.g. auto-approve confidence) come from config/constants, not inline.
- **Per-environment config** (dev/staging/prod) with no code changes.

## 5. Error & exception handling

- **Never swallow errors.** Catch only to add context, recover, or translate — then
  log or rethrow. No empty `catch {}`.
- **Typed, domain-specific errors** (e.g. `JobNotFoundError`, `AtsSubmissionError`)
  mapped to correct HTTP status codes by a **global exception filter/middleware**.
- **Validate all input at the boundary** (API DTOs, form inputs) before it reaches
  business logic; reject with clear, safe messages.
- **Never leak internals** (stack traces, secrets, SQL) to clients or logs shipped
  externally. User-facing messages are friendly and actionable.
- **External calls are wrapped** with timeouts, retries with backoff (idempotent
  jobs only), and circuit-breaking where appropriate (ATS, LLM, email).
- **Frontend:** every async view has explicit **loading / empty / error** states and
  an **error boundary** with a fallback UI — never a blank screen or raw error (§9-FE).

## 6. Performance & optimization

- **Async/non-blocking by default;** never block the event loop (TS) or the request
  thread with heavy CPU work — offload to the worker/queue.
- **Database:** index query paths, avoid N+1 (eager/batch loads), select only needed
  columns, **paginate all list endpoints** (cursor-based preferred).
- **Cache** expensive/repeated reads (Redis) with sensible TTLs and invalidation.
- **Fast API responses:** keep request handlers thin; push slow work (parsing,
  matching, applying, emailing) to background jobs and return quickly.
- **Measure before optimizing;** add timing/metrics to hot paths, don't guess.
- **Frontend:** code-split, lazy-load, memoize expensive renders, optimize images,
  keep bundle size in check.

## 7. Scalability

- **Stateless services** — no in-memory session/state; use DB/cache/queue so any
  instance can serve any request and scale horizontally.
- **Queue-based decoupling** (BullMQ/Celery) for all long-running/failure-prone work;
  jobs are **idempotent** and safely retryable.
- **Rate-limit** outbound integrations (per-domain ATS limits, email sending caps).
- **Design for multi-tenancy from day one** (scoped by user/org); no cross-tenant leaks.

## 8. Security

- Authn/authz on every protected route; **enforce authorization server-side**, never
  trust the client. Flag any endpoint left unauthenticated.
- Parameterized queries / ORM only — **no string-built SQL.** Escape/validate all
  user input; sanitize anything rendered.
- Encrypt PII and resumes at rest and in transit; least-privilege DB/service creds.
- Keep dependencies pinned and scanned; no unreviewed/typosquat packages.
- Honor the compliance rules in [PROJECT_PLAN §5](PROJECT_PLAN.md#5-legal-ethical--compliance)
  (consent, unsubscribe, robots/ToS, data export & erasure).

## 9. Testing, logging & observability

**Testing**
- Unit-test business logic (services, matching, parsing); integration-test API
  endpoints and DB access; e2e-test critical flows (apply pipeline).
- New feature or bug fix ⇒ tests added/updated. Aim for meaningful coverage of logic,
  not a coverage-number game.
- Tests are deterministic and isolated; mock external services (ATS, LLM, email).

**Logging & observability (backend)**
- **Structured logging** (JSON) via a shared logger — never `console.log`/`print`.
  Include correlation/request IDs; **never log secrets or full PII.**
- Sensible levels (debug/info/warn/error); errors go to error tracking (Sentry).
- Emit metrics for hot paths and key business events (match generated, application
  submitted, email sent, automation success/failure).

**Fallback UI (frontend) — §9-FE**
- Error boundaries around routes/features with a friendly fallback and a recovery
  action (retry / go back).
- Skeletons/spinners for loading; clear empty states; inline, actionable error
  messages for failed actions (with retry). Toasts for transient feedback.

## 10. Backend specifics (NestJS + Python worker)

- **NestJS:** feature modules; DTOs validated with `class-validator`/Zod; global
  exception filter + interceptors for logging; `ConfigModule` for typed config;
  Prisma in repository layer. Controllers thin, services own logic.
- **Python worker:** FastAPI + Pydantic models; typed; Celery/RQ tasks idempotent
  with retries; Playwright automation isolated with timeouts and health checks.
- **Contracts:** share request/response types between API and frontend; version any
  public API. Communicate API↔worker over the queue + a small typed internal API.

## 11. Frontend specifics (Next.js + Tailwind + Cloudscape)

- **Component library:** **Cloudscape Design System** is the primary component set;
  build screens from its components (layout, forms, tables, navigation) for
  consistency and accessibility out of the box.
- **Tailwind CSS** for layout/spacing utilities and custom bits **only** — do not
  fight or override Cloudscape internals; prefer Cloudscape tokens/props first, reach
  for Tailwind for gaps. Keep the two from conflicting (scope utilities, avoid
  restyling Cloudscape component internals).
- **Reusable, composable components** with typed props and sensible defaults; no
  copy-pasted UI. Presentational vs container separation; keep data-fetching in
  hooks/server components, not deep in the tree.
- **Accessibility (WCAG 2.1 AA):** semantic markup, keyboard navigation, labels,
  focus management, sufficient contrast — Cloudscape helps; verify anyway.
- **State/data:** server state via a data layer (e.g. React Query) with loading/error
  handling built in; avoid prop-drilling; keep global state minimal.
- **Responsive, web-first;** design works from mobile widths up.

## 12. Database standards

- **Chosen database: Supabase (managed PostgreSQL).** Rationale in
  [PROJECT_PLAN §4](PROJECT_PLAN.md#4-architecture--tech-stack) and below.
- **Migrations only** — schema changes are versioned, reviewed migrations (Prisma
  Migrate); never hand-edit production schema.
- **Normalize by default;** denormalize deliberately for measured read performance.
- **Constraints in the DB** (FKs, unique, not-null, checks) — the DB is the last line
  of integrity defense, not just the app.
- **Index intentionally** for real query paths; review slow queries.
- **Access only through the repository layer**; no raw queries scattered in services.
- **PII columns** identified and handled per compliance (encryption, deletion).
- Use **`pgvector`** for embeddings powering semantic job matching.

## 13. Git & branching workflow

**Branch model (HireX convention):**

| Branch | Role |
|--------|------|
| `master` | **Production.** Deployable, protected. Only release-ready code lands here. |
| `main` | **Post-deploy sync** of `master` (mirrors production after each deployment). |
| `development` | **Integration / staging.** Feature branches merge here first. |
| `feat/<feature-name>` | Feature work. Also `fix/<name>`, `chore/<name>`, `docs/<name>`. |

**Flow:** `feat/*` → PR into **`development`** → validated → promoted to **`master`**
(production) → **`main`** synced from `master` after deployment.

- **Never commit directly to `master`, `main`, or `development`** — always a branch + PR.
- **Conventional commit messages** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`…),
  imperative, explaining the *why*.
- **Small, focused PRs** with a description of what/why and how it was tested.
- **CI must pass** (lint, type-check, tests, build) before merge.
- Never commit secrets, `.env`, or large binaries.

## 14. Definition of Done

A change is done only when:

- [ ] Meets the golden rules (§1) and relevant section rules.
- [ ] No hard-coded config/secrets; new config added to `.env.example` + config schema.
- [ ] Reuses/extracts shared code where appropriate; no needless duplication.
- [ ] All failure paths handled; frontend has loading/empty/error + fallback UI.
- [ ] Lint, type-check, tests, and build are green in CI.
- [ ] Tests added/updated for new logic or fixed bugs.
- [ ] Authorization enforced server-side; no unauth'd endpoint left unflagged.
- [ ] Docs/README updated if behavior or setup changed.




