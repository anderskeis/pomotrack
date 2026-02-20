"""API routes for Pomotrack."""

import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import KanbanTask, SessionRecord

router = APIRouter()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="healthy", version="1.0.0")


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


class SessionIn(BaseModel):
    id: str
    type: str
    label: str = ""
    startedAt: int
    completedAt: int
    duration: int


class SessionOut(BaseModel):
    id: str
    type: str
    label: str
    startedAt: int
    completedAt: int
    duration: int


def _record_to_out(r: SessionRecord) -> SessionOut:
    return SessionOut(
        id=r.id,
        type=r.type,
        label=r.label,
        startedAt=r.started_at,
        completedAt=r.completed_at,
        duration=r.duration,
    )


@router.get("/sessions", response_model=list[SessionOut])
async def list_sessions(db: AsyncSession = Depends(get_session)):
    """Return all sessions ordered by most recent first."""
    result = await db.execute(
        select(SessionRecord).order_by(SessionRecord.completed_at.desc())
    )
    return [_record_to_out(r) for r in result.scalars().all()]


@router.post("/sessions", status_code=200)
async def upsert_session(body: SessionIn, db: AsyncSession = Depends(get_session)):
    """Upsert a single session (idempotent — safe to call multiple times)."""
    record = SessionRecord(
        id=body.id,
        type=body.type,
        label=body.label,
        started_at=body.startedAt,
        completed_at=body.completedAt,
        duration=body.duration,
    )
    await db.merge(record)
    await db.commit()
    return {"ok": True}


@router.post("/sessions/batch", status_code=200)
async def batch_upsert_sessions(
    body: list[SessionIn], db: AsyncSession = Depends(get_session)
):
    """Bulk upsert sessions (used for initial migration from localStorage)."""
    for item in body:
        record = SessionRecord(
            id=item.id,
            type=item.type,
            label=item.label,
            started_at=item.startedAt,
            completed_at=item.completedAt,
            duration=item.duration,
        )
        await db.merge(record)
    await db.commit()
    return {"ok": True, "count": len(body)}


@router.delete("/sessions", status_code=200)
async def delete_all_sessions(db: AsyncSession = Depends(get_session)):
    """Delete all sessions."""
    await db.execute(delete(SessionRecord))
    await db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Kanban tasks
# ---------------------------------------------------------------------------


class KanbanTaskIn(BaseModel):
    id: str
    title: str
    status: str
    pomodorosCompleted: int = 0
    createdAt: int
    completedAt: Optional[int] = None


class KanbanTaskOut(BaseModel):
    id: str
    title: str
    status: str
    pomodorosCompleted: int
    createdAt: int
    completedAt: Optional[int]


def _task_to_out(t: KanbanTask) -> KanbanTaskOut:
    return KanbanTaskOut(
        id=t.id,
        title=t.title,
        status=t.status,
        pomodorosCompleted=t.pomodoros_completed,
        createdAt=t.created_at,
        completedAt=t.completed_at,
    )


@router.get("/kanban/tasks", response_model=list[KanbanTaskOut])
async def list_tasks(db: AsyncSession = Depends(get_session)):
    """Return all kanban tasks ordered by creation time."""
    result = await db.execute(
        select(KanbanTask).order_by(KanbanTask.created_at.asc())
    )
    return [_task_to_out(t) for t in result.scalars().all()]


@router.post("/kanban/tasks", response_model=KanbanTaskOut, status_code=201)
async def create_task(body: KanbanTaskIn, db: AsyncSession = Depends(get_session)):
    """Create a new kanban task."""
    task = KanbanTask(
        id=body.id,
        title=body.title,
        status=body.status,
        pomodoros_completed=body.pomodorosCompleted,
        created_at=body.createdAt,
        completed_at=body.completedAt,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _task_to_out(task)


@router.put("/kanban/tasks/{task_id}", response_model=KanbanTaskOut)
async def update_task(
    task_id: str, body: KanbanTaskIn, db: AsyncSession = Depends(get_session)
):
    """Full update of a kanban task."""
    task = await db.get(KanbanTask, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    task.title = body.title
    task.status = body.status
    task.pomodoros_completed = body.pomodorosCompleted
    task.completed_at = body.completedAt
    await db.commit()
    await db.refresh(task)
    return _task_to_out(task)


@router.delete("/kanban/tasks/{task_id}", status_code=200)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_session)):
    """Delete a single kanban task."""
    task = await db.get(KanbanTask, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
    return {"ok": True}


@router.delete("/kanban/tasks", status_code=200)
async def delete_all_tasks(db: AsyncSession = Depends(get_session)):
    """Delete all kanban tasks."""
    await db.execute(delete(KanbanTask))
    await db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Azure Blob sync
# ---------------------------------------------------------------------------


class SyncCredentials(BaseModel):
    accountName: str
    containerName: str
    accountKey: str


class PushResult(BaseModel):
    ok: bool
    exportedSessions: int
    exportedTasks: int
    exportedAt: str


class PullResult(BaseModel):
    ok: bool
    importedSessions: int
    importedTasks: int


SYNC_BLOB_NAME = "pomotrack-sync.json"


def _build_blob_client(creds: SyncCredentials):
    """Build a synchronous Azure BlobClient (runs in thread pool)."""
    try:
        from azure.storage.blob import BlobServiceClient
    except ImportError as e:
        raise RuntimeError("azure-storage-blob is not installed") from e

    service = BlobServiceClient(
        account_url=f"https://{creds.accountName}.blob.core.windows.net",
        credential=creds.accountKey,
    )
    return service.get_blob_client(
        container=creds.containerName, blob=SYNC_BLOB_NAME
    )


@router.post("/sync/push", response_model=PushResult)
async def push_sync(
    creds: SyncCredentials, db: AsyncSession = Depends(get_session)
):
    """Serialize all data to JSON and upload to Azure Blob Storage."""
    sessions_result = await db.execute(select(SessionRecord))
    tasks_result = await db.execute(select(KanbanTask))
    sessions = sessions_result.scalars().all()
    tasks = tasks_result.scalars().all()

    payload = {
        "version": 1,
        "exportedAt": datetime.now(timezone.utc).isoformat(),
        "sessions": [
            {
                "id": s.id,
                "type": s.type,
                "label": s.label,
                "startedAt": s.started_at,
                "completedAt": s.completed_at,
                "duration": s.duration,
            }
            for s in sessions
        ],
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "pomodorosCompleted": t.pomodoros_completed,
                "createdAt": t.created_at,
                "completedAt": t.completed_at,
            }
            for t in tasks
        ],
    }

    json_bytes = json.dumps(payload, ensure_ascii=False).encode()

    def _upload():
        client = _build_blob_client(creds)
        client.upload_blob(json_bytes, overwrite=True)

    try:
        await asyncio.to_thread(_upload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Azure upload failed: {e}") from e

    return PushResult(
        ok=True,
        exportedSessions=len(sessions),
        exportedTasks=len(tasks),
        exportedAt=payload["exportedAt"],
    )


@router.post("/sync/pull", response_model=PullResult)
async def pull_sync(
    creds: SyncCredentials, db: AsyncSession = Depends(get_session)
):
    """Download JSON from Azure Blob Storage and replace local data."""

    def _download() -> bytes:
        client = _build_blob_client(creds)
        return client.download_blob().readall()

    try:
        raw = await asyncio.to_thread(_download)
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Azure download failed: {e}"
        ) from e

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail="Invalid sync file format") from e

    await db.execute(delete(SessionRecord))
    await db.execute(delete(KanbanTask))

    for s in payload.get("sessions", []):
        await db.merge(
            SessionRecord(
                id=s["id"],
                type=s["type"],
                label=s.get("label", ""),
                started_at=s["startedAt"],
                completed_at=s["completedAt"],
                duration=s["duration"],
            )
        )

    for t in payload.get("tasks", []):
        await db.merge(
            KanbanTask(
                id=t["id"],
                title=t["title"],
                status=t["status"],
                pomodoros_completed=t.get("pomodorosCompleted", 0),
                created_at=t["createdAt"],
                completed_at=t.get("completedAt"),
            )
        )

    await db.commit()

    return PullResult(
        ok=True,
        importedSessions=len(payload.get("sessions", [])),
        importedTasks=len(payload.get("tasks", [])),
    )
