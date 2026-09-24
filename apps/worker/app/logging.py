"""Structured (JSON) logging with correlation IDs (rulebook §9).

- JSON output via ``structlog`` — never ``print``.
- A per-request/per-task ``correlation_id`` is carried in a context variable and
  injected into every log line, so a request can be traced end to end.
- Secrets/PII must never be logged: use ``bind_context`` for identifiers only,
  and keep ``SecretStr`` values out of event kwargs.

Call ``configure_logging()`` once at process startup (API app and Celery worker).
"""

from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar
from typing import Any

import structlog

_correlation_id: ContextVar[str | None] = ContextVar("correlation_id", default=None)


def set_correlation_id(correlation_id: str | None = None) -> str:
    """Bind a correlation ID to the current context, generating one if absent."""
    resolved = correlation_id or uuid.uuid4().hex
    _correlation_id.set(resolved)
    return resolved


def get_correlation_id() -> str | None:
    """Return the correlation ID bound to the current context, if any."""
    return _correlation_id.get()


def _add_correlation_id(
    _logger: Any, _method: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """structlog processor: attach the current correlation ID to every event."""
    correlation_id = _correlation_id.get()
    if correlation_id is not None:
        event_dict.setdefault("correlation_id", correlation_id)
    return event_dict


def configure_logging(level: str = "INFO", *, json_output: bool = True) -> None:
    """Configure structlog + stdlib logging for structured JSON output.

    Idempotent enough to call once per process at startup.

    Args:
        level: Root log level name (e.g. ``"INFO"``).
        json_output: Emit JSON (production) vs. a console renderer (local dev).
    """
    numeric_level = logging.getLevelName(level.upper())
    if not isinstance(numeric_level, int):
        numeric_level = logging.INFO

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=numeric_level,
    )

    renderer: structlog.types.Processor = (
        structlog.processors.JSONRenderer()
        if json_output
        else structlog.dev.ConsoleRenderer()
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            _add_correlation_id,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(numeric_level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Return a bound structlog logger."""
    return structlog.get_logger(name)  # type: ignore[no-any-return]
