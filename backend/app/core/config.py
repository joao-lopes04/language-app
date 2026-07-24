import json

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_CORS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


class Settings(BaseSettings):
    """Application settings loaded from environment variables (optional .env file)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Language Study API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./japanese_study.db"
    # Comma-separated URLs or JSON array — stored as str so Render env vars parse reliably.
    cors_origins_env: str | None = Field(default=None, validation_alias="CORS_ORIGINS")
    secret_key: str = "dev-only-change-me-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7
    admin_emails: str | None = Field(default=None, validation_alias="ADMIN_EMAILS")
    # When true, forgot-password response includes reset token (local dev only).
    expose_password_reset_token: bool = False

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins(self) -> list[str]:
        raw = self.cors_origins_env
        if raw is None or not raw.strip():
            return list(_DEFAULT_CORS)
        text = raw.strip()
        if text.startswith("["):
            parsed = json.loads(text)
            if not isinstance(parsed, list):
                raise ValueError("CORS_ORIGINS JSON must be an array of strings")
            return [str(item).strip() for item in parsed if str(item).strip()]
        return [part.strip() for part in text.split(",") if part.strip()]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def admin_email_set(self) -> set[str]:
        raw = self.admin_emails
        if not raw or not raw.strip():
            return set()
        return {part.strip().lower() for part in raw.split(",") if part.strip()}


settings = Settings()
