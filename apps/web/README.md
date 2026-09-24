# @hirex/web

The HireX web app — the candidate-facing dashboard for the AI job-application
copilot. Built with **Next.js 14 (App Router) + TypeScript (strict)** and the
**Cloudscape Design System** as the primary component library, per the
[Engineering Rulebook](../../docs/ENGINEERING_GUIDELINES.md) §11.

## Getting started

From the repo root (npm workspaces):

```bash
# 1. Install dependencies (root installs all workspaces)
npm install

# 2. Configure the environment
cp apps/web/.env.example apps/web/.env.local
#   then edit apps/web/.env.local and set NEXT_PUBLIC_API_URL

# 3. Run the dev server
npm run dev:web        # or: npm run dev -w apps/web
```

The app runs at http://localhost:3000.

### Scripts

| Script            | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the Next.js dev server          |
| `npm run build`   | Production build                      |
| `npm run start`   | Serve the production build            |
| `npm run lint`    | ESLint (`next lint`)                  |
| `npm run typecheck` | `tsc --noEmit` (strict)             |

## Configuration

No URLs or environment-specific values are hard-coded (Rulebook §4). All config
comes from the environment and is **validated with Zod at first use** in
[`src/lib/config.ts`](src/lib/config.ts), which fails fast with a clear message
if a value is missing or malformed.

| Variable              | Required | Description                                  |
| --------------------- | -------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | yes      | Base URL of the HireX NestJS API, no trailing slash. |

Only `NEXT_PUBLIC_*` variables are exposed to the browser. Add any new key to
[`.env.example`](.env.example) **and** the Zod schema in `src/lib/config.ts`.

## Cloudscape + Tailwind convention

- **Cloudscape is the primary UI toolkit.** Build screens from its components
  (`AppLayout`, `TopNavigation`, `SideNavigation`, `Table`, `Cards`, `Form`,
  `Alert`, `Spinner`, …). It gives us consistency and WCAG 2.1 AA accessibility
  out of the box. `@cloudscape-design/global-styles` is imported once in
  `app/layout.tsx`.
- **Tailwind is for layout/spacing gaps only** — never to override Cloudscape
  internals (Rulebook §11). To keep the two from conflicting, Tailwind is
  configured (see `tailwind.config.ts`) with:
  - `preflight` **disabled** (no CSS reset fighting Cloudscape), and
  - a `tw-` class prefix so our utilities are always distinguishable and cannot
    clobber Cloudscape class names.
- Prefer Cloudscape tokens/props first; reach for a `tw-` utility only for a
  spacing/layout gap Cloudscape does not cover.

## Structure

```
app/
  layout.tsx              # Root: ErrorBoundary > Providers > AppShell
  providers.tsx           # React Query provider
  error.tsx               # App Router route-level error fallback
  not-found.tsx           # 404 fallback
  page.tsx                # Dashboard
  matches/page.tsx        # Matches (Cloudscape Cards)
  applications/page.tsx   # Applications tracker (Cloudscape Table)
  components/
    AppShell.tsx          # Cloudscape AppLayout + Top/Side navigation
    PageShell.tsx         # Reusable page header/layout wrapper
    DataState.tsx         # Typed loading/empty/error wrapper for async views
    ErrorBoundary.tsx     # Top-level React error boundary + fallback UI
src/
  lib/
    config.ts             # Zod-validated typed config (no hard-coded URLs)
    api-client.ts         # Typed fetch client (timeouts, typed ApiError)
    query-keys.ts         # Centralized React Query keys
    format.ts             # Shared formatting/status helpers
  hooks/
    useMatches.ts         # Query hook (mock data, shaped for the real API)
    useApplications.ts    # Query hook (mock data, shaped for the real API)
  types/domain.ts         # Local domain types (TODO: move to @hirex/shared)
  mocks/fixtures.ts       # Mock data for the scaffolding phase
```

## Failure handling (Rulebook §5, §9-FE)

Every async view is wrapped in [`<DataState>`](app/components/DataState.tsx),
which renders explicit **loading** (Cloudscape `Spinner`), **empty** (Cloudscape
empty state), and **error** (Cloudscape `Alert` + retry) states — never a blank
screen or a raw error. A top-level React `ErrorBoundary` plus Next.js
`error.tsx`/`not-found.tsx` provide friendly fallbacks with recovery actions.

## Data layer

Server state is managed with **React Query**. The `useMatches` / `useApplications`
hooks currently resolve **mock data** but are already shaped to call the real API
via `api-client.ts` — see the `TODO(api)` comments to switch each over. Domain
types live in `src/types/domain.ts` with a `TODO(shared-types)` to re-export from
`@hirex/shared` once that workspace package exists.

## Follow-ups

- Install dependencies at the repo root (`npm install`) — versions are pinned in
  `package.json`.
- Create the `@hirex/shared` package and move `src/types/domain.ts` into it.
- Replace mock hook bodies with real API calls once the NestJS endpoints exist.
- Wire error reporting (Sentry) where the `TODO(observability)` comments are.
