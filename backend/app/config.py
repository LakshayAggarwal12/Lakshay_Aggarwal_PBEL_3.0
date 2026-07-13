"""
Centralized application configuration.

Everything environment-specific (DB url, CORS origins, upload limits) lives
here and nowhere else, so moving from SQLite -> Postgres or dev -> prod is a
one-file change.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./resume_screener.db"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    max_upload_size_mb: int = 5
    allowed_extensions: str = ".pdf,.docx"
    app_env: str = "development"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def extensions_list(self) -> list[str]:
        return [e.strip().lower() for e in self.allowed_extensions.split(",") if e.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def normalized_database_url(self) -> str:
        """
        Managed Postgres providers (Render, Heroku, Supabase, etc.) commonly
        hand out connection strings starting with 'postgres://', but
        SQLAlchemy 1.4+/2.x requires 'postgresql://' — it raises on the old
        scheme. Normalize here so pasting a provider's connection string
        straight into .env just works without a manual edit.
        """
        url = self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    # lru_cache -> settings are parsed once and reused, not re-read on every request
    return Settings()
