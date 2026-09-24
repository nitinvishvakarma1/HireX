"""Celery application wired from typed settings (rulebook §4, §7).

Redis is the broker and result backend. Defaults (retries, backoff, time limits)
come from ``Settings`` — no magic numbers inline. Import task modules here so the
worker registers them:

    celery -A app.tasks.queue:celery_app worker --loglevel=info
"""

from __future__ import annotations

from celery import Celery

from app.config import get_settings
from app.logging import configure_logging

settings = get_settings()
configure_logging(level=settings.log_level, json_output=settings.is_production)

celery_app = Celery(
    settings.service_name,
    broker=str(settings.redis_url),
    backend=str(settings.redis_url),
    include=[
        "app.tasks.resume",
        "app.tasks.application",
    ],
)

celery_app.conf.update(
    task_acks_late=True,  # redeliver on worker crash — safe because tasks are idempotent
    task_reject_on_worker_lost=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,  # fair dispatch for long-running jobs
    task_soft_time_limit=settings.task_soft_time_limit_seconds,
    task_time_limit=settings.task_hard_time_limit_seconds,
    task_default_retry_delay=settings.task_retry_backoff_seconds,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)
