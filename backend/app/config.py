"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings, configurable via environment variables."""

    # Server
    port: int = 7070
    log_level: str = "info"

    # CORS origins (comma-separated)
    cors_origins: str = ""

    model_config = {"env_prefix": "POMOTRACK_"}

    def get_cors_origins(self) -> list[str]:
        """Build the list of allowed CORS origins."""
        defaults = [
            f"http://localhost:{self.port}",
            f"http://127.0.0.1:{self.port}",
            "http://localhost:5173",  # Vite dev server
            "http://127.0.0.1:5173",
        ]
        if self.cors_origins:
            extras = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
            defaults.extend(extras)
        return defaults


settings = Settings()
