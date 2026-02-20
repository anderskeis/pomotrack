"""Tests for the Pomotrack API."""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.database import get_session
from app.main import app

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def transport():
    return ASGITransport(app=app)


@pytest.fixture
async def db_engine():
    """In-memory SQLite engine with tables created fresh for each test."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def client(transport, db_engine):
    """HTTP client with the DB dependency overridden to use in-memory SQLite."""
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)

    async def override_get_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


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
    assert response.status_code in (404, 200)


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

SESSION_PAYLOAD = {
    "id": "test-session-1",
    "type": "focus",
    "label": "Coding",
    "startedAt": 1700000000000,
    "completedAt": 1700001500000,
    "duration": 1500,
}


@pytest.mark.asyncio
async def test_sessions_empty_initially(client):
    response = await client.get("/api/sessions")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_post_session(client):
    response = await client.post("/api/sessions", json=SESSION_PAYLOAD)
    assert response.status_code == 200
    assert response.json()["ok"] is True


@pytest.mark.asyncio
async def test_list_sessions_after_post(client):
    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    response = await client.get("/api/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == SESSION_PAYLOAD["id"]
    assert data[0]["label"] == "Coding"


@pytest.mark.asyncio
async def test_post_session_idempotent(client):
    """Posting the same session twice should not duplicate it."""
    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    response = await client.get("/api/sessions")
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_batch_post_sessions(client):
    payload = [SESSION_PAYLOAD, {**SESSION_PAYLOAD, "id": "test-session-2", "label": "Review"}]
    response = await client.post("/api/sessions/batch", json=payload)
    assert response.status_code == 200
    assert response.json()["count"] == 2
    sessions = (await client.get("/api/sessions")).json()
    assert len(sessions) == 2


@pytest.mark.asyncio
async def test_delete_all_sessions(client):
    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    await client.delete("/api/sessions")
    response = await client.get("/api/sessions")
    assert response.json() == []


# ---------------------------------------------------------------------------
# Kanban tasks
# ---------------------------------------------------------------------------

TASK_PAYLOAD = {
    "id": "task-001",
    "title": "Write tests",
    "status": "todo",
    "pomodorosCompleted": 0,
    "createdAt": 1700000000000,
    "completedAt": None,
}


@pytest.mark.asyncio
async def test_kanban_tasks_empty_initially(client):
    response = await client.get("/api/kanban/tasks")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_kanban_task(client):
    response = await client.post("/api/kanban/tasks", json=TASK_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == TASK_PAYLOAD["id"]
    assert data["title"] == "Write tests"
    assert data["status"] == "todo"


@pytest.mark.asyncio
async def test_update_kanban_task(client):
    await client.post("/api/kanban/tasks", json=TASK_PAYLOAD)
    updated = {**TASK_PAYLOAD, "status": "in-progress", "pomodorosCompleted": 1}
    response = await client.put(f"/api/kanban/tasks/{TASK_PAYLOAD['id']}", json=updated)
    assert response.status_code == 200
    assert response.json()["status"] == "in-progress"
    assert response.json()["pomodorosCompleted"] == 1


@pytest.mark.asyncio
async def test_update_nonexistent_task_returns_404(client):
    response = await client.put("/api/kanban/tasks/no-such-id", json=TASK_PAYLOAD)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_kanban_task(client):
    await client.post("/api/kanban/tasks", json=TASK_PAYLOAD)
    await client.delete(f"/api/kanban/tasks/{TASK_PAYLOAD['id']}")
    response = await client.get("/api/kanban/tasks")
    assert response.json() == []


@pytest.mark.asyncio
async def test_delete_all_kanban_tasks(client):
    await client.post("/api/kanban/tasks", json=TASK_PAYLOAD)
    second = {**TASK_PAYLOAD, "id": "task-002", "title": "Deploy"}
    await client.post("/api/kanban/tasks", json=second)
    await client.delete("/api/kanban/tasks")
    response = await client.get("/api/kanban/tasks")
    assert response.json() == []
