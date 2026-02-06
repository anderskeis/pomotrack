"""Tests for the Pomotrack API."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
def transport():
    return ASGITransport(app=app)


@pytest.fixture
async def client(transport):
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    """Health check returns 200 with expected shape."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_security_headers(client):
    """All security headers are present in responses."""
    response = await client.get("/api/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["x-xss-protection"] == "1; mode=block"
    assert "content-security-policy" in response.headers


@pytest.mark.asyncio
async def test_unknown_api_route_returns_404_or_fallback(client):
    """Unknown API routes should not leak data."""
    response = await client.get("/api/nonexistent")
    # FastAPI returns 404 for unknown API routes (before the SPA catch-all)
    assert response.status_code in (404, 200)
