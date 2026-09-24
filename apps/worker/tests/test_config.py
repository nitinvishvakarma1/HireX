"""Tests for typed configuration loading & fail-fast validation."""

from __future__ import annotations

import pytest

from app.config import Settings, get_settings
from app.exceptions import ConfigurationError


def test_get_settings_loads_from_env(valid_env: dict[str, str]) -> None:
    settings = get_settings()
    assert isinstance(settings, Settings)
    assert str(settings.redis_url).startswith("redis://")
    assert settings.storage_bucket == valid_env["STORAGE_BUCKET"]


def test_get_settings_is_cached(valid_env: dict[str, str]) -> None:
    assert get_settings() is get_settings()


def test_secrets_are_not_exposed_in_repr(valid_env: dict[str, str]) -> None:
    settings = get_settings()
    # SecretStr must never leak the raw value via str/repr (rulebook §9).
    assert "test-key" not in repr(settings)
    assert settings.anthropic_api_key.get_secret_value() == "test-key"


def test_missing_required_config_fails_fast(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.config.Settings.model_config", {"env_file": None, "extra": "ignore"})
    for key in ("REDIS_URL", "DATABASE_URL", "ANTHROPIC_API_KEY", "STORAGE_BUCKET"):
        monkeypatch.delenv(key, raising=False)
    get_settings.cache_clear()

    with pytest.raises(ConfigurationError):
        get_settings()

    get_settings.cache_clear()


def test_invalid_redis_url_fails_fast(valid_env: dict[str, str], monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("REDIS_URL", "not-a-url")
    get_settings.cache_clear()

    with pytest.raises(ConfigurationError):
        get_settings()

    get_settings.cache_clear()
