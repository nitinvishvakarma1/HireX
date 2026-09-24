"""Typed domain exceptions for the HireX worker.

Rulebook §5: prefer typed, domain-specific errors over bare ``Exception`` so
callers (and the API layer, over the queue) can react precisely and map to the
right outcome. Never swallow errors — raise one of these with context instead.
"""

from __future__ import annotations


class WorkerError(Exception):
    """Base class for all worker-domain errors."""


class ConfigurationError(WorkerError):
    """Raised when configuration is missing or invalid at startup (fail fast)."""


class ResumeParseError(WorkerError):
    """Raised when a resume reference cannot be fetched or parsed."""

    def __init__(self, resume_ref: str, reason: str) -> None:
        self.resume_ref = resume_ref
        self.reason = reason
        super().__init__(f"Failed to parse resume {resume_ref!r}: {reason}")


class AiGenerationError(WorkerError):
    """Raised when the AI provider fails to produce usable output."""


class AtsSubmissionError(WorkerError):
    """Raised when an application could not be submitted to an ATS."""

    def __init__(self, application_id: str, reason: str) -> None:
        self.application_id = application_id
        self.reason = reason
        super().__init__(f"ATS submission failed for {application_id!r}: {reason}")


class ManualFallbackRequired(WorkerError):
    """Signal that automation cannot proceed and a human must take over.

    Raised deliberately (e.g. a captcha / bot-check was encountered) so the API
    can surface the application for manual completion. This is an expected,
    non-retryable outcome — not a bug. HireX never bypasses bot detection
    (PROJECT_PLAN §5.2).
    """

    def __init__(self, application_id: str, reason: str) -> None:
        self.application_id = application_id
        self.reason = reason
        super().__init__(f"Manual fallback required for {application_id!r}: {reason}")
