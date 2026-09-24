"""FastAPI worker service entrypoint.

Exposes a small internal HTTP surface (health checks / readiness). The heavy,
failure-prone work runs on the Celery queue (``app.tasks``), keeping HTTP
handlers thin and fast (rulebook §6, §10).

Run locally:
    uvicorn app.main:app --reload --port 8001
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request, Response
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.logging import configure_logging, get_logger, set_correlation_id

CORRELATION_HEADER = "X-Correlation-ID"

logger = get_logger(__name__)


class HealthResponse(BaseModel):
    """Response body for the health endpoint."""

    status: str
    service: str
    environment: str


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Validate configuration and set up logging before serving traffic."""
    settings = get_settings()  # fails fast if config is invalid
    configure_logging(level=settings.log_level, json_output=settings.is_production)
    logger.info("worker.startup", service=settings.service_name, env=settings.environment)
    try:
        yield
    finally:
        logger.info("worker.shutdown", service=settings.service_name)


app = FastAPI(title="HireX Worker", version="0.1.0", lifespan=lifespan)


@app.middleware("http")
async def correlation_id_middleware(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """Bind an inbound/generated correlation ID for the lifetime of the request."""
    correlation_id = set_correlation_id(request.headers.get(CORRELATION_HEADER))
    response = await call_next(request)
    response.headers[CORRELATION_HEADER] = correlation_id
    return response


@app.get("/health", response_model=HealthResponse, tags=["ops"])
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Liveness probe. Cheap and dependency-free by design."""
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        environment=settings.environment,
    )
