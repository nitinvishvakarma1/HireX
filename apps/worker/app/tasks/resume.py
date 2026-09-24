"""Resume parsing task (rulebook §7 — idempotent, retryable, typed).

``parse_resume`` fetches a stored resume by reference, extracts a structured
profile, and persists it. Only a typed stub is provided here; the parsing/NLP
implementation lands in Phase 1.
"""

from __future__ import annotations

from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from pydantic import BaseModel, Field

from app.config import get_settings
from app.exceptions import ResumeParseError
from app.logging import get_logger, set_correlation_id

logger = get_logger(__name__)


class ParsedResume(BaseModel):
    """Structured profile extracted from a resume."""

    resume_ref: str
    full_name: str | None = None
    emails: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    years_experience: float | None = None


@shared_task(
    bind=True,
    name="resume.parse",
    acks_late=True,
)
def parse_resume(self, resume_ref: str, correlation_id: str | None = None) -> dict[str, object]:
    """Parse a stored resume into a structured profile.

    Idempotent: keyed on ``resume_ref`` — re-running upserts the same parsed
    profile, so redelivery/retries are safe.

    Args:
        resume_ref: Storage reference (e.g. ``s3://bucket/user/resume.pdf``).
        correlation_id: Propagated trace ID from the enqueuing service.

    Returns:
        The parsed profile as a JSON-serializable dict.

    Raises:
        ResumeParseError: fetch/parse failure — retried with backoff up to the
            configured limit, then surfaced for manual review.
    """
    settings = get_settings()
    set_correlation_id(correlation_id)
    log = logger.bind(task="resume.parse", resume_ref=resume_ref, attempt=self.request.retries)
    log.info("resume.parse.started")

    try:
        if not resume_ref:
            raise ResumeParseError(resume_ref, "empty resume reference")

        # TODO(phase-1): fetch from object storage, detect type (PDF/DOCX),
        # extract text, run NLP, and upsert the profile keyed by resume_ref.
        parsed = ParsedResume(resume_ref=resume_ref)

        log.info("resume.parse.completed")
        return parsed.model_dump()

    except SoftTimeLimitExceeded as exc:
        log.error("resume.parse.timeout")
        raise ResumeParseError(resume_ref, "soft time limit exceeded") from exc
    except ResumeParseError as exc:
        # Retry with settings-driven exponential backoff, then give up for review.
        countdown = settings.task_retry_backoff_seconds * (2**self.request.retries)
        log.warning("resume.parse.retryable_error", reason=exc.reason, retry_in=countdown)
        raise self.retry(exc=exc, countdown=countdown, max_retries=settings.task_max_retries)
