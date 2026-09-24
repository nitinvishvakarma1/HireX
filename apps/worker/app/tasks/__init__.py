"""Background task package (Celery). Tasks are idempotent and retryable."""

from app.tasks.queue import celery_app

__all__ = ["celery_app"]
