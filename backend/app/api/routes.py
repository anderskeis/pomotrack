"""API routes for Pomotrack."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str


class ConfigResponse(BaseModel):
    """Default configuration response."""
    focus_duration: int  # minutes
    short_break_duration: int  # minutes
    long_break_duration: int  # minutes
    pomodoros_until_long_break: int


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", version="1.0.0")


@router.get("/config", response_model=ConfigResponse)
async def get_default_config():
    """Get default Pomodoro configuration."""
    return ConfigResponse(
        focus_duration=25,
        short_break_duration=5,
        long_break_duration=15,
        pomodoros_until_long_break=4,
    )
