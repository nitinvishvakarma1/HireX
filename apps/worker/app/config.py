"""Typed application configuration (rulebook §4 — nothing hard-coded).

All configuration comes from the environment, is validated at import time via
``get_settings()``, and fails fast on missing/invalid values. Secrets are held
as ``SecretStr`` so they are not accidentally logged or serialized.

Env keys mirror the repo-root ``.env.example``.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, PostgresDsn, RedisDsn, SecretStr, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.exceptions import ConfigurationError


class Settings(BaseSettings):
    """Validated worker settings loaded from environment / ``.env``."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Core service ----
    environment: str = Field(default="development", description="dev/staging/prod")
    log_level: str = Field(default="INFO")
    service_name: str = Field(default="hirex-worker")

    # ---- Infrastructure (required, no defaults → fail fast if absent) ----
    redis_url: RedisDsn = Field(..., description="Broker + result backend + cache")
    database_url: PostgresDsn = Field(..., description="Supabase Postgres DSN")

    # ---- AI ----
    anthropic_api_key: SecretStr = Field(..., description="Anthropic API key")
    anthropic_model: str = Field(default="claude-sonnet-4-5")

    # ---- Object storage (S3-compatible, e.g. Supabase Storage) ----
    storage_s3_endpoint: str = Field(...)
    storage_s3_region: str = Field(...)
    storage_s3_access_key_id: SecretStr = Field(...)
    storage_s3_secret_access_key: SecretStr = Field(...)
    storage_bucket: str = Field(...)

    # ---- Tunables (no magic numbers inline; rulebook §4) ----
    task_max_retries: int = Field(default=3, ge=0)
    task_retry_backoff_seconds: int = Field(default=5, ge=1)
    task_soft_time_limit_seconds: int = Field(default=120, ge=1)
    task_hard_time_limit_seconds: int = Field(default=180, ge=1)
    ats_page_timeout_ms: int = Field(default=30_000, ge=1_000)
    ats_navigation_timeout_ms: int = Field(default=45_000, ge=1_000)
    ai_request_timeout_seconds: float = Field(default=60.0, gt=0)

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"prod", "production"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide settings singleton.

    Raises:
        ConfigurationError: if any required value is missing or invalid, so the
            service fails fast at startup instead of at first use.
    """
    try:
        return Settings()  # type: ignore[call-arg]  # values sourced from env
    except ValidationError as exc:
        raise ConfigurationError(
            f"Invalid or missing worker configuration:\n{exc}"
        ) from exc
