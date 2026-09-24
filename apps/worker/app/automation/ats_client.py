"""Isolated Playwright ATS automation (rulebook §5, §10; PROJECT_PLAN §5.2).

A thin, swappable service that submits an application to an ATS via a headless
browser. Design constraints enforced here:

- **Explicit timeouts** on navigation and per-action, from config.
- **``try/finally`` cleanup** — the browser/context is always closed.
- **Manual-fallback signal** — on any bot-check/captcha or unexpected failure,
  raise :class:`ManualFallbackRequired` so a human finishes the application.
- **No captcha/bot-detection bypass.** HireX detects and defers; it never defeats
  these protections. Do not add such logic here.

Only a typed placeholder is implemented; real selectors/flows land in Phase 2.
"""

from __future__ import annotations

from types import TracebackType
from typing import Protocol

from pydantic import BaseModel

from app.config import Settings, get_settings
from app.exceptions import AtsSubmissionError, ManualFallbackRequired
from app.logging import get_logger

logger = get_logger(__name__)

# Signals on the page that indicate a human must take over — never bypassed.
_BOT_CHECK_MARKERS: tuple[str, ...] = ("captcha", "recaptcha", "hcaptcha", "are you human")


class AtsSubmission(BaseModel):
    """Input payload for an ATS submission."""

    application_id: str
    apply_url: str
    field_values: dict[str, str]
    resume_ref: str


class AtsSubmissionReceipt(BaseModel):
    """Confirmation returned by the ATS on successful submission."""

    application_id: str
    confirmation_ref: str | None = None


class AtsClient(Protocol):
    """Interface for ATS submission backends (rulebook §3 — swappable)."""

    async def submit(self, submission: AtsSubmission) -> AtsSubmissionReceipt: ...


class PlaywrightAtsClient:
    """Playwright-backed :class:`AtsClient`.

    Manages a single browser lifecycle per submission and guarantees cleanup.
    """

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._browser: object | None = None
        self._playwright: object | None = None

    async def __aenter__(self) -> "PlaywrightAtsClient":
        # TODO(phase-2): launch chromium here (async_playwright().start()).
        return self

    async def __aexit__(
        self,
        _exc_type: type[BaseException] | None,
        _exc: BaseException | None,
        _tb: TracebackType | None,
    ) -> None:
        await self.close()

    async def close(self) -> None:
        """Best-effort teardown of browser + Playwright driver."""
        # TODO(phase-2): close context/browser and stop the driver; swallow
        # teardown errors after logging so cleanup never masks the real error.
        self._browser = None
        self._playwright = None

    async def submit(self, submission: AtsSubmission) -> AtsSubmissionReceipt:
        """Fill and submit the application form on the target ATS.

        Args:
            submission: Target URL, mapped field values, and resume reference.

        Returns:
            An :class:`AtsSubmissionReceipt` on success.

        Raises:
            ManualFallbackRequired: a bot-check/captcha was detected, or the flow
                could not complete automatically — defer to the human.
            AtsSubmissionError: a genuine, retryable submission failure.
        """
        log = logger.bind(application_id=submission.application_id, url=submission.apply_url)
        log.info("ats.submit.started")
        try:
            async with self:
                # TODO(phase-2): navigate with
                #   page.goto(url, timeout=self._settings.ats_navigation_timeout_ms)
                # set page.set_default_timeout(self._settings.ats_page_timeout_ms),
                # fill fields, upload the resume, and submit.
                #
                # Before/after each step, detect bot-checks and defer:
                #   if any(m in (await page.content()).lower() for m in _BOT_CHECK_MARKERS):
                #       raise ManualFallbackRequired(id, "bot-check detected")
                raise ManualFallbackRequired(
                    submission.application_id,
                    "automation not yet implemented — deferring to manual apply",
                )
        except (ManualFallbackRequired, AtsSubmissionError):
            raise
        except Exception as exc:  # translate unknowns, never swallow (rulebook §5)
            log.error("ats.submit.unexpected_error", error=str(exc))
            raise ManualFallbackRequired(
                submission.application_id, "unexpected automation error"
            ) from exc
        finally:
            log.info("ats.submit.finished")
