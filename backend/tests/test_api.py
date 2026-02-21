"""Tests for the Pomotrack API."""

import json

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

import app.api.routes as routes_module
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

SYNC_CREDS = {
    "accountName": "test-account",
    "containerName": "test-container",
    "accountKey": "test-key",
}


class _FakeDownload:
    def __init__(self, data: bytes):
        self._data = data

    def readall(self) -> bytes:
        return self._data


class _FakeBlobClient:
    def __init__(self):
        self.uploaded_bytes: bytes | None = None
        self.download_bytes: bytes = b"{}"

    def upload_blob(self, data: bytes, overwrite: bool):
        assert overwrite is True
        self.uploaded_bytes = data

    def download_blob(self):
        return _FakeDownload(self.download_bytes)


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


# ---------------------------------------------------------------------------
# Sync
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_sync_push_uploads_expected_payload(client, monkeypatch):
    fake_blob = _FakeBlobClient()
    monkeypatch.setattr(routes_module, "_build_blob_client", lambda _creds: fake_blob)

    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    await client.post("/api/kanban/tasks", json=TASK_PAYLOAD)

    response = await client.post("/api/sync/push", json=SYNC_CREDS)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["exportedSessions"] == 1
    assert data["exportedTasks"] == 1

    assert fake_blob.uploaded_bytes is not None
    payload = json.loads(fake_blob.uploaded_bytes)
    assert payload["version"] == 1
    assert len(payload["sessions"]) == 1
    assert len(payload["tasks"]) == 1


@pytest.mark.asyncio
async def test_sync_pull_replaces_local_data(client, monkeypatch):
    fake_blob = _FakeBlobClient()
    monkeypatch.setattr(routes_module, "_build_blob_client", lambda _creds: fake_blob)

    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    await client.post("/api/kanban/tasks", json=TASK_PAYLOAD)

    replacement = {
        "version": 1,
        "exportedAt": "2026-01-01T00:00:00Z",
        "sessions": [
            {
                "id": "pulled-session",
                "type": "focus",
                "label": "Pulled",
                "startedAt": 1700000100000,
                "completedAt": 1700001600000,
                "duration": 1500,
            }
        ],
        "tasks": [
            {
                "id": "pulled-task",
                "title": "Pulled Task",
                "status": "todo",
                "pomodorosCompleted": 0,
                "createdAt": 1700000100000,
                "completedAt": None,
            }
        ],
    }
    fake_blob.download_bytes = json.dumps(replacement).encode("utf-8")

    response = await client.post("/api/sync/pull", json=SYNC_CREDS)
    assert response.status_code == 200
    assert response.json()["importedSessions"] == 1
    assert response.json()["importedTasks"] == 1

    sessions = (await client.get("/api/sessions")).json()
    tasks = (await client.get("/api/kanban/tasks")).json()
    assert [s["id"] for s in sessions] == ["pulled-session"]
    assert [t["id"] for t in tasks] == ["pulled-task"]


@pytest.mark.asyncio
async def test_sync_pull_invalid_payload_does_not_modify_local_data(client, monkeypatch):
    fake_blob = _FakeBlobClient()
    monkeypatch.setattr(routes_module, "_build_blob_client", lambda _creds: fake_blob)

    await client.post("/api/sessions", json=SESSION_PAYLOAD)
    await client.post("/api/kanban/tasks", json=TASK_PAYLOAD)

    invalid_payload = {
        "version": 1,
        "sessions": [{"id": "broken-session"}],
        "tasks": [],
    }
    fake_blob.download_bytes = json.dumps(invalid_payload).encode("utf-8")

    response = await client.post("/api/sync/pull", json=SYNC_CREDS)
    assert response.status_code == 422

    sessions = (await client.get("/api/sessions")).json()
    tasks = (await client.get("/api/kanban/tasks")).json()
    assert len(sessions) == 1
    assert sessions[0]["id"] == SESSION_PAYLOAD["id"]
    assert len(tasks) == 1
    assert tasks[0]["id"] == TASK_PAYLOAD["id"]
