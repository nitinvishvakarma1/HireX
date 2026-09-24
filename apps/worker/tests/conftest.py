"""Shared pytest fixtures. External services are always mocked (rulebook §9)."""

from __future__ import annotations

from collections.abc import Iterator

import pytest

# A complete, valid environment for constructing Settings under test.
_VALID_ENV: dict[str, str] = {
    "REDIS_URL": "redis://localhost:6379/0",
    "DATABASE_URL": "postgresql://user:pass@localhost:5432/hirex",
    "ANTHROPIC_API_KEY": "test-key",
    "STORAGE_S3_ENDPOINT": "https://example.storage.test/s3",
    "STORAGE_S3_REGION": "ap-south-1",
    "STORAGE_S3_ACCESS_KEY_ID": "test-access-key",
    "STORAGE_S3_SECRET_ACCESS_KEY": "test-secret-key",
    "STORAGE_BUCKET": "test-bucket",
}


@pytest.fixture
def valid_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[dict[str, str]]:
    """Populate a valid environment and clear the settings cache around the test."""
    from app.config import get_settings

    # Ignore any real .env so tests are deterministic and isolated.
    monkeypatch.setattr("app.config.Settings.model_config", {"env_file": None, "extra": "ignore"})
    for key, value in _VALID_ENV.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()
    yield dict(_VALID_ENV)
    get_settings.cache_clear()
