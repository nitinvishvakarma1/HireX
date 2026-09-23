<h1 align="center">HireX</h1>

<p align="center">
  <b>An AI job-application copilot.</b><br/>
  HireX finds the most relevant companies and roles for you, tailors your resume and
  cover letter to each job, and — with your approval — applies on your behalf.
</p>

---

> **Status:** 🚧 Planning / pre-MVP. This repository currently contains the project
> plan, requirements, and architecture. No application code yet.

## What is HireX?

Job hunting is repetitive and slow: finding relevant openings, re-tailoring your
resume for each one, filling long application forms, and following up. HireX
automates the tedious parts while keeping **you in control**:

1. **Understands you** — parses your resume and preferences (roles, locations, salary).
2. **Finds & ranks matches** — surfaces the most relevant companies/roles in your
   target city / state / country, with an explainable match score.
3. **Tailors your materials** — rewrites your resume and generates a cover letter
   per job for maximum ATS (Applicant Tracking System) relevance.
4. **Applies with your approval** — queues applications through official channels;
   you approve (or set auto-approve for high-confidence matches).
5. **Tracks everything** — a pipeline of applied → screening → interview → offer.

## Design principles

- **Human-in-the-loop, not a spam cannon.** HireX augments the applicant; it does
  not blast unsolicited email at scale. See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md#5-legal-ethical--compliance).
- **Official channels first.** Prefer ATS/job-board integrations (Greenhouse, Lever,
  Workday, etc.) over scraping and cold email.
- **Consent & compliance by design.** CAN-SPAM / GDPR / CASL aware, rate-limited,
  unsubscribe-honoring outreach as an opt-in secondary feature.
- **Explainability & trust.** Every match and every action is reviewable.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | **Next.js** (React, TypeScript, App Router) + Tailwind CSS |
| Backend API | **NestJS** (TypeScript) |
| AI / Automation worker | **Python (FastAPI)** service — resume parsing, LLM tailoring, browser automation |
| Queue / jobs | BullMQ (Redis) |
| Database | PostgreSQL (+ Prisma), Redis (cache/queue) |
| AI | Claude (Anthropic) for tailoring, matching, cover letters |
| Automation | Playwright (form filling, ATS interaction) |
| Infra | Docker, cloud (AWS/GCP/Render) |

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md#4-architecture--tech-stack) for the
rationale behind the backend choice.

## Documentation

- 📋 [Project Plan](docs/PROJECT_PLAN.md) — vision, scope, architecture, roadmap, legal.
- ✅ [Requirements](docs/REQUIREMENTS.md) — functional & non-functional requirements, user stories.

## License

[MIT](LICENSE) © 2026 Nitin Vishwakarma
