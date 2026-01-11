"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.api.routes import router as api_router

app = FastAPI(
    title="Pomotrack",
    description="Single-user Pomodoro timer",
    version="1.0.0",
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Static files and SPA serving
static_path = Path(__file__).parent.parent / "static"

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
        file_path = static_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_path / "index.html")
