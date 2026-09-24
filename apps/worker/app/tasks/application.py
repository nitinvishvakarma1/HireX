"""Job-application submission task (rulebook §7 — idempotent, retryable, typed).

``apply_to_job`` drives ATS submission for a previously approved application.
Submission itself is delegated to the isolated Playwright automation
(``app.automation.ats_client``); a captcha / bot-check raises
``ManualFallbackRequired`` and is NOT retried (PROJECT_PLAN §5.2).
"""

from __future__ import annotations

from enum import Enum

from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from pydantic import BaseModel

from app.config import get_settings
from app.exceptions import AtsSubmissionError, ManualFallbackRequired
from app.logging import get_logger, set_correlation_id

logger = get_logger(__name__)


class ApplicationOutcome(str, Enum):
    """Terminal outcome of an application submission attempt."""

    SUBMITTED = "submitted"
    MANUAL_FALLBACK = "manual_fallback"


class ApplicationResult(BaseModel):
    """Result reported back to the API for tracker updates."""

    application_id: str
    outcome: ApplicationOutcome
    detail: str | None = None


@shared_task(
    bind=True,
    name="application.apply",
    acks_late=True,
)
def apply_to_job(
    self, application_id: str, correlation_id: str | None = None
) -> dict[str, object]:
    """Submit an approved application to its target ATS.

    Idempotent: keyed on ``application_id``. The task must first check whether the
    application is already ``submitted`` (via the shared DB) and no-op if so, so a
    redelivered message never double-submits.

    Args:
        application_id: ID of the approved application to submit.
        correlation_id: Propagated trace ID from the enqueuing service.

    Returns:
        An :class:`ApplicationResult` as a JSON-serializable dict.

    Raises:
        AtsSubmissionError: transient submission failure — retried with backoff.
        ManualFallbackRequired: expected, non-retryable; the API surfaces the
            application for the user to finish by hand.
    """
    settings = get_settings()
    set_correlation_id(correlation_id)
    log = logger.bind(
        task="application.apply",
        application_id=application_id,
        attempt=self.request.retries,
    )
    log.info("application.apply.started")

    try:
        if not application_id:
            raise AtsSubmissionError(application_id, "empty application id")

        # TODO(phase-2): load the application + tailored docs; short-circuit if
        # already submitted (idempotency); then drive the ATS via the Playwright
        # client. Kept as a stub here.
        result = ApplicationResult(
            application_id=application_id, outcome=ApplicationOutcome.SUBMITTED
        )
        log.info("application.apply.completed", outcome=result.outcome.value)
        return result.model_dump()

    except ManualFallbackRequired as exc:
        # Expected outcome, not an error to retry — report and stop.
        log.warning("application.apply.manual_fallback", reason=exc.reason)
        return ApplicationResult(
            application_id=application_id,
            outcome=ApplicationOutcome.MANUAL_FALLBACK,
            detail=exc.reason,
        ).model_dump()
    except SoftTimeLimitExceeded as exc:
        log.error("application.apply.timeout")
        raise AtsSubmissionError(application_id, "soft time limit exceeded") from exc
    except AtsSubmissionError as exc:
        # Retry with settings-driven exponential backoff, then give up for review.
        countdown = settings.task_retry_backoff_seconds * (2**self.request.retries)
        log.warning("application.apply.retryable_error", reason=exc.reason, retry_in=countdown)
        raise self.retry(exc=exc, countdown=countdown, max_retries=settings.task_max_retries)
