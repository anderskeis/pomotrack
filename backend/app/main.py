"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.routes import router as api_router
from app.config import settings
from app.database import create_db_and_tables


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Prevent XSS attacks (legacy, but still useful)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "media-src 'self'"
        )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise database tables on startup."""
    await create_db_and_tables()
    yield


app = FastAPI(
    title="Pomotrack",
    description="Single-user Pomodoro timer",
    version="1.0.0",
    lifespan=lifespan,
)

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware - restricted for local use
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=False,  # Not needed for this app
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Static files and SPA serving
static_path = Path(__file__).parent.parent / "static"
static_path_resolved = static_path.resolve()

if static_path.exists():
    # Serve static assets (JS, CSS, images)
    assets_path = static_path / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Serve sounds directory
    sounds_path = static_path / "sounds"
    if sounds_path.exists():
        app.mount("/sounds", StaticFiles(directory=sounds_path), name="sounds")

    # SPA fallback - serve index.html for all non-API routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the SPA for all non-API routes."""
        # Resolve the requested path
        file_path = (static_path / full_path).resolve()

        # Security: Prevent path traversal attacks
        # Ensure the resolved path is within the static directory
        try:
            file_path.relative_to(static_path_resolved)
        except ValueError:
            # Path is outside static directory - return index.html
            return FileResponse(static_path / "index.html")

        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_path / "index.html")
