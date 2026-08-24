from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Fail-closed settings for the stateless private-bundle API."""

    APP_ENV: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    PORT: int = Field(default=8000, ge=1, le=65535)
    URL_EXTRACTION_MINIMUM_INTERVAL_SECONDS: float = Field(default=1.0, ge=0.0, le=60.0)
    VERSION: str = "0.1.0"
    PRIVATE_MODEL_BUNDLE_DIR: str = ""
    PRIVATE_MODEL_MANIFEST_SHA256: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("CORS_ORIGINS")
    @classmethod
    def validate_production_cors(cls, origins: list[str], info):
        if info.data.get("APP_ENV", "development").lower() == "production" and (
            not origins or any(origin == "*" or not origin.startswith("https://") for origin in origins)
        ):
            raise ValueError("production CORS origins must be explicit HTTPS origins")
        return origins


settings = Settings()
