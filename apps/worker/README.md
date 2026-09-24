# HireX Worker

Python (FastAPI + Celery) service for HireX's AI and automation work: resume
parsing, AI resume tailoring / cover-letter generation, and Playwright-driven
ATS submission. It is decoupled from the NestJS API via the Redis queue so a
stuck browser job never blocks a web request (see
[PROJECT_PLAN §4](../../docs/PROJECT_PLAN.md#4-architecture--tech-stack)).

Built to the [Engineering Rulebook](../../docs/ENGINEERING_GUIDELINES.md):
typed throughout, config via validated Pydantic settings (nothing hard-coded),
structured JSON logging with correlation IDs, idempotent retryable tasks, and
isolated automation with explicit timeouts.

## Requirements

- Python 3.11+
- Redis (broker + result backend + cache) — `docker compose up -d redis` at the repo root
- Supabase Postgres and an Anthropic API key (see below)

## Setup

```bash
cd apps/worker
python -m venv .venv
source .venv/bin/activate          # Windows: .venv/Scripts/activate
pip install -r requirements-dev.txt   # runtime + lint/type tooling
playwright install chromium           # browser for ATS automation
```

## Configuration

All configuration comes from the environment and is validated at startup
(`app/config.py`); the service fails fast on missing/invalid values. Keys live
in the repo-root [`.env.example`](../../.env.example) — copy it to `.env` and
fill in real values. Never commit real secrets.

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Celery broker + result backend + cache |
| `DATABASE_URL` | Supabase Postgres DSN |
| `ANTHROPIC_API_KEY` | Claude API key (AI tailoring) |
| `STORAGE_S3_ENDPOINT` / `STORAGE_S3_REGION` | Object storage (resumes/docs) |
| `STORAGE_S3_ACCESS_KEY_ID` / `STORAGE_S3_SECRET_ACCESS_KEY` | Storage creds |
| `STORAGE_BUCKET` | Storage bucket name |

Tunables (retries, backoff, task time limits, ATS/AI timeouts) also come from
config — see `Settings` in `app/config.py`.

## Running

FastAPI service (health/readiness surface):

```bash
uvicorn app.main:app --reload --port 8001
# GET http://localhost:8001/health
```

Celery worker (processes queued jobs):

```bash
celery -A app.tasks.queue:celery_app worker --loglevel=info
```

## Development

```bash
ruff check .          # lint
black .               # format
mypy app tests        # type-check
pytest                # tests (externals mocked; Celery runs eager)
```

## Structure

```
apps/worker/
├── app/
│   ├── config.py            # Pydantic settings, validated & fail-fast
│   ├── logging.py           # structured JSON logging + correlation IDs
│   ├── exceptions.py        # typed domain errors
│   ├── main.py              # FastAPI app + /health + correlation middleware
│   ├── tasks/
│   │   ├── queue.py         # Celery app (broker/backend/limits from config)
│   │   ├── resume.py        # parse_resume — idempotent, retryable
│   │   └── application.py   # apply_to_job — idempotent, retryable
│   ├── automation/
│   │   └── ats_client.py    # Playwright ATS client; timeouts, cleanup, fallback
│   └── ai/
│       └── tailor.py        # Anthropic wrapper (interface + stub)
└── tests/                   # config + task/automation tests (mocked externals)
```

## Notes & guardrails

- **No captcha / bot-detection bypass.** Automation detects bot-checks and raises
  `ManualFallbackRequired` so a human finishes the application
  ([PROJECT_PLAN §5.2](../../docs/PROJECT_PLAN.md#5-legal-ethical--compliance)).
- **Idempotent tasks.** `parse_resume` (keyed on `resume_ref`) and `apply_to_job`
  (keyed on `application_id`) are safe to retry / redeliver; `apply_to_job` must
  short-circuit if an application is already submitted.
- Task bodies and the AI/ATS integrations are **typed stubs**; real logic lands
  in Phases 1–2 of the roadmap.
