"""Thin, typed Anthropic wrapper for resume tailoring & cover letters.

Rulebook §3/§4/§5: depend on an interface (swappable, testable), read the API
key from validated config (never hard-coded), wrap the external call with a
timeout, and translate failures into a typed :class:`AiGenerationError`.

Only the interface and a stub implementation are provided; prompt engineering
and response parsing land in Phase 2.
"""

from __future__ import annotations

from typing import Protocol

from anthropic import AsyncAnthropic
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.exceptions import AiGenerationError
from app.logging import get_logger

logger = get_logger(__name__)


class TailoringRequest(BaseModel):
    """Inputs for tailoring application materials to a specific job."""

    resume_text: str
    job_title: str
    job_description: str
    company_name: str


class TailoredDocuments(BaseModel):
    """Generated, job-specific application materials."""

    tailored_resume: str
    cover_letter: str


class ResumeTailor(Protocol):
    """Interface for AI tailoring backends (rulebook §3 — swappable)."""

    async def tailor(self, request: TailoringRequest) -> TailoredDocuments: ...


class AnthropicResumeTailor:
    """Claude-backed :class:`ResumeTailor`."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._client = AsyncAnthropic(
            api_key=self._settings.anthropic_api_key.get_secret_value(),
            timeout=self._settings.ai_request_timeout_seconds,
        )

    async def tailor(self, request: TailoringRequest) -> TailoredDocuments:
        """Generate a tailored resume + cover letter for a job.

        Args:
            request: Source resume text and the target job details.

        Returns:
            The generated :class:`TailoredDocuments`.

        Raises:
            AiGenerationError: the provider failed or returned unusable output.
        """
        log = logger.bind(
            model=self._settings.anthropic_model,
            job_title=request.job_title,
            company=request.company_name,
        )
        log.info("ai.tailor.started")
        try:
            # TODO(phase-2): build a structured prompt, call
            #   await self._client.messages.create(model=..., max_tokens=...,
            #       messages=[...]), and parse the response into TailoredDocuments.
            raise AiGenerationError("resume tailoring not yet implemented")
        except AiGenerationError:
            raise
        except Exception as exc:  # translate provider errors, never swallow (rulebook §5)
            log.error("ai.tailor.provider_error", error=str(exc))
            raise AiGenerationError("Anthropic request failed") from exc
