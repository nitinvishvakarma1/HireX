# HireX — Project Plan

> Living document. Last updated: 2026-09-24.

## Table of contents

1. [Vision & problem](#1-vision--problem)
2. [Target users](#2-target-users)
3. [Scope](#3-scope)
4. [Architecture & tech stack](#4-architecture--tech-stack)
5. [Legal, ethical & compliance](#5-legal-ethical--compliance)
6. [Roadmap](#6-roadmap)
7. [Success metrics](#7-success-metrics)
8. [Key risks & mitigations](#8-key-risks--mitigations)

---

## 1. Vision & problem

**Problem.** Applying for jobs is repetitive, slow, and demoralizing. Candidates
spend hours finding relevant openings, re-tailoring resumes for each ATS, filling
near-identical forms, and following up — for a low hit rate.

**Vision.** HireX is an **AI job-application copilot** that removes the busywork
while keeping the candidate in control. It finds the most relevant companies and
roles, tailors application materials to each one, applies through official channels
with the user's approval, and tracks the whole pipeline.

**Positioning.** *Augmentation, not automation-at-any-cost.* HireX is explicitly
**not** a tool for blasting unsolicited email at recruiters. That framing is a
product decision, a legal necessity, and a deliverability requirement (see §5).

---

## 2. Target users

| Persona | Needs |
|---------|-------|
| **Active job seeker** | Apply to many relevant roles fast without losing quality. |
| **Passive / selective seeker** | Get notified only about high-fit roles; apply selectively. |
| **New grad / career switcher** | Guidance on which roles fit; resume tailoring help. |
| **Busy professional** | Delegate the search; approve applications in one tap. |

## 3. Scope

### In scope (MVP)

- Resume upload + parsing into a structured profile.
- Preference capture: roles, seniority, locations (city/state/country), remote,
  salary range, must-haves.
- Job discovery via job-board / ATS integrations, ranked by an explainable match score.
- AI resume tailoring + cover-letter generation per job.
- ATS keyword / relevance score before applying.
- Application queue with **preview + one-click approve** (and optional auto-approve
  above a confidence threshold).
- Automated form-fill submission through supported ATS platforms.
- Application tracker (Kanban: matched → applied → screening → interview → offer).
- Email notifications + digest.

### Out of scope (MVP) — deferred / opt-in later

- Mass cold outreach to scraped recruiter emails (legally sensitive — see §5).
- Native mobile app (web-first; thin mobile app for approvals comes later).
- Interview prep, salary insights, referral finder (fast-follow features).
- Multi-language resume support.

### Explicit non-goals

- Being a bulk unsolicited-email tool.
- Bypassing captchas / bot-detection in violation of a platform's terms.
- Submitting deceptive or auto-generated-looking applications at scale.

## 4. Architecture & tech stack

### 4.1 Backend choice: Express vs NestJS vs Python

**Recommendation: NestJS as the primary API + a dedicated Python (FastAPI) worker
service for AI & automation.** For the MVP you can start with NestJS alone and
extract the Python worker when the AI/scraping complexity justifies it.

**Why not plain Express?** Express is minimal and unopinionated. For a domain this
complex (auth, queues, integrations, websockets, a growing schema) you'd end up
rebuilding the structure NestJS gives you for free. Great for tiny services; a
liability as the surface grows.

**Why NestJS for the API layer?**
- **Same language as the Next.js frontend** (TypeScript) → shared types/DTOs,
  one hiring profile for the team, less context switching.
- **Opinionated structure** (modules, dependency injection, guards, pipes) suits a
  complex, long-lived domain far better than ad-hoc Express.
- First-class **BullMQ** queue integration, WebSockets/SSE, validation, and testing.

**Why a Python service for AI/automation?** The *differentiating* work lives here,
and Python's ecosystem is strongest for it:
- Resume parsing / NLP (spaCy, unstructured, PDF/DOCX tooling).
- LLM orchestration and evaluation.
- Browser automation (Playwright has excellent Python support; Scrapy for crawling).

The API and worker communicate over the **queue (Redis/BullMQ)** and a small internal
REST/gRPC surface. This keeps the fragile, long-running automation isolated from the
user-facing API so a stuck browser job never blocks a web request.

> **Pragmatic MVP path:** if you're solo, ship **NestJS only** first (Playwright and
> the Anthropic SDK both exist in TypeScript), then split out the Python worker once
> parsing/matching complexity grows. Don't run two services before you need to.

### 4.2 Stack summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js (App Router), TypeScript, Tailwind, Cloudscape Design System | SSR dashboard, responsive web-first |
| API | NestJS (TypeScript) | Auth, REST, WebSocket/SSE, orchestration |
| Worker | Python + FastAPI + Celery/RQ | Parsing, matching, tailoring, automation |
| Automation | Playwright | Form fill, ATS interaction |
| AI | Claude (Anthropic API) | Tailoring, matching, cover letters |
| Data | Supabase (PostgreSQL) + Prisma, pgvector; Redis | Relational data + embeddings; cache + queue |
| Queue | BullMQ (Node) / Celery (Python) | Background jobs, retries, rate limits |
| Auth | Auth.js / Clerk or NestJS JWT + OAuth | Email + Google/LinkedIn login |
| Storage | S3-compatible | Resumes, generated documents |
| Email | Transactional provider (Postmark/SES) | Notifications, opt-in outreach |
| Infra | Docker, CI/CD, cloud (AWS/GCP/Render) | Containerized services |
| Observability | Structured logs, Sentry, metrics | Track job success/failure rates |

### 4.3 High-level flow

```
User → Next.js dashboard → NestJS API
                              │
             ┌────────────────┼─────────────────┐
             ▼                ▼                  ▼
         PostgreSQL       Redis/Queue        Object storage
                              │
                              ▼
                    Python worker service
             (parse · match · tailor · Playwright apply)
                              │
                              ▼
                External: ATS / job boards / email
```

### 4.4 Database choice: MongoDB Atlas vs Supabase Postgres

**Recommendation: Supabase (managed PostgreSQL).** HireX's data is strongly
relational — users, resumes, profiles, companies, jobs, applications, the
status pipeline, outreach logs, suppression lists — with many relationships and a need
for transactions (an application submission must be consistent) and rich querying.
That is a relational/Postgres fit, not a document-store fit.

Why Supabase specifically over plain Postgres or MongoDB Atlas:
- **Relational integrity + transactions + SQL** — the right model for this domain, and
  SQL is a generalized, widely-known skill (matches our "generalized approaches" rule).
- **`pgvector` built in** — store embeddings for **semantic job matching** in the same
  database, no separate vector store.
- **Batteries included** — managed Postgres plus auth, object storage, row-level
  security, and realtime, which accelerate the MVP. Use as much or as little as you
  want; NestJS + Prisma can treat it as "just Postgres" and own auth itself.
- Mongo's flexible schema is nice for freeform resume/job JSON, but we get that with
  Postgres `jsonb` where needed, without giving up relational guarantees.

Prisma is the ORM either way; the repository layer isolates the DB so a future move is
contained.

## 5. Legal, ethical & compliance

> **This section is not optional.** The riskiest part of HireX is not the code — it
> is scraping personal contact data and sending unsolicited email. Getting this wrong
> means fines, a blacklisted sending domain, and harm to users. Design around it.

### 5.1 Key regulations

- **CAN-SPAM (US):** unsolicited commercial email must include a valid physical
  address, a clear opt-out, and honor unsubscribes promptly.
- **GDPR / PECR (EU/UK):** scraping and processing personal data (recruiter emails)
  requires a lawful basis; unsolicited marketing email generally needs consent.
- **CASL (Canada):** among the strictest — consent generally required before sending.
- **Platform Terms of Service:** LinkedIn, Workday, Greenhouse, Indeed, etc. often
  prohibit scraping and automated submission. Violations risk account bans and legal action.

### 5.2 Product rules that follow from this

1. **Official channels first.** Prefer ATS/job-board APIs and integrations over
   scraping + cold email.
2. **Cold recruiter outreach is opt-in, personalized, and rate-limited** — never the
   default, never bulk, never to purchased/scraped lists at scale.
3. **Every outbound email** includes sender identity, physical address, and one-click
   unsubscribe; suppression lists are honored globally.
4. **Human approval** before submitting applications (auto-approve is opt-in and
   bounded by a confidence threshold the user sets).
5. **Respect robots.txt / rate limits;** do not defeat captchas or bot-detection.
6. **Data minimization & security:** encrypt resumes and PII at rest and in transit;
   let users export and delete their data (GDPR right to erasure).

### 5.3 Action items before launch

- [ ] Consult a lawyer on outreach + scraping in target markets.
- [ ] Draft Terms of Service and Privacy Policy.
- [ ] Set up sending-domain authentication (SPF, DKIM, DMARC) and reputation monitoring.
- [ ] Build a global suppression/unsubscribe list from day one.

## 6. Roadmap

### Phase 0 — Foundations (this repo)
Planning, requirements, architecture, repo setup. ← *you are here*

### Phase 1 — MVP core (weeks 1–6)
- Auth + user profile.
- Resume upload → parse → structured profile.
- Preferences capture.
- Job discovery via **one** ATS/job-board integration, with match scoring.
- Application tracker (manual entries).

### Phase 2 — AI & assisted apply (weeks 6–12)
- AI resume tailoring + cover-letter generation.
- ATS relevance score.
- Application queue with preview + one-click approve.
- Automated form-fill for the first supported ATS via Playwright.
- Email notifications + digest.

### Phase 3 — Scale & trust (weeks 12–20)
- More ATS/job-board integrations.
- Auto-approve with confidence threshold.
- Compliance tooling (suppression list, DMARC, audit log).
- Analytics dashboard (application → response rates).

### Phase 4 — Fast-follow features
- Interview prep, salary insights, referral finder.
- Opt-in, compliant recruiter outreach.
- Thin mobile app for approvals + notifications.

## 7. Success metrics

- **Activation:** % of signups that upload a resume and set preferences.
- **Time saved:** median minutes per application vs manual baseline.
- **Match quality:** user-rated relevance of surfaced roles.
- **Apply conversion:** % of matches the user approves.
- **Outcome:** application → recruiter-response rate; interviews booked.
- **Health:** automation success rate; email deliverability / complaint rate.

## 8. Key risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Legal exposure (scraping / unsolicited email) | Fines, shutdown | Official channels first; opt-in, compliant outreach; legal review (§5) |
| Sending domain blacklisted | Product unusable | SPF/DKIM/DMARC, warm-up, rate limits, suppression list |
| ATS anti-bot breaks automation | Failed applies | Prefer APIs; resilient selectors; human fallback; monitor success rate |
| Recruiter/ATS perception of auto-applies | Hurts users | Quality tailoring, human approval, no spraying |
| Scope creep | Delayed MVP | Strict MVP scope (§3); phased roadmap (§6) |


