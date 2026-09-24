"""Task & automation tests with all externals mocked/stubbed (rulebook §9).

Celery is run in eager mode so tasks execute inline and deterministically; no
broker, DB, browser, or AI provider is contacted.
"""

from __future__ import annotations

import pytest

from app.automation.ats_client import AtsSubmission, PlaywrightAtsClient
from app.exceptions import ManualFallbackRequired


@pytest.fixture
def eager_celery(valid_env: dict[str, str]):  # type: ignore[no-untyped-def]
    """Configure the Celery app to run tasks inline."""
    from app.tasks.queue import celery_app

    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True
    return celery_app


def test_parse_resume_returns_structured_profile(eager_celery) -> None:  # type: ignore[no-untyped-def]
    from app.tasks.resume import parse_resume

    result = parse_resume.apply(args=["s3://bucket/user/resume.pdf"]).get()

    assert result["resume_ref"] == "s3://bucket/user/resume.pdf"
    assert result["skills"] == []


def test_apply_to_job_reports_submitted(eager_celery) -> None:  # type: ignore[no-untyped-def]
    from app.tasks.application import ApplicationOutcome, apply_to_job

    result = apply_to_job.apply(args=["app-123"]).get()

    assert result["application_id"] == "app-123"
    assert result["outcome"] == ApplicationOutcome.SUBMITTED.value


async def test_ats_client_signals_manual_fallback(valid_env: dict[str, str]) -> None:
    """The Playwright stub must never bypass automation — it defers to a human."""
    client = PlaywrightAtsClient()
    submission = AtsSubmission(
        application_id="app-123",
        apply_url="https://ats.example.test/apply",
        field_values={"full_name": "Ada Lovelace"},
        resume_ref="s3://bucket/user/resume.pdf",
    )

    with pytest.raises(ManualFallbackRequired) as excinfo:
        await client.submit(submission)

    assert excinfo.value.application_id == "app-123"
