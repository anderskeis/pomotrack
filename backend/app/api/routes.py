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


class PullRequest(BaseModel):
    merge: bool = True
    conflictStrategy: str = "keep_local"  # keep_local, keep_cloud, keep_newer


class SyncPullRequest(SyncCredentials, PullRequest):
    """Combined credentials + pull options for /sync/pull and /sync/pull/preview."""
    pass


class PushResult(BaseModel):
    ok: bool
    exportedSessions: int
    exportedTasks: int
    exportedAt: str


class PullResult(BaseModel):
    ok: bool
    importedSessions: int
    importedTasks: int
    mergedSessions: int = 0
    mergedTasks: int = 0
    conflicts: int = 0


class PullPreviewResult(BaseModel):
    ok: bool
    newSessions: int
    newTasks: int
    updatedSessions: int
    updatedTasks: int
    conflictCount: int


class SyncInfoResult(BaseModel):
    ok: bool
    version: int
    exportedAt: Optional[str]
    sessionCount: int
    taskCount: int


class SyncPayload(BaseModel):
    version: int
    exportedAt: Optional[str] = None
    sessions: list[SessionIn] = []
    tasks: list[KanbanTaskIn] = []


SYNC_BLOB_NAME = "pomotrack-sync.json"


def _get_timestamp_for_record(record_type: str, record_data: dict) -> int:
    """Get timestamp for conflict resolution."""
    if record_type == "session":
        return record_data.get("completedAt", 0)
    return record_data.get("createdAt", 0)


def _resolve_conflict(
    local_record: Optional[SessionRecord | KanbanTask],
    cloud_data: dict,
    strategy: str,
    record_type: str,
) -> tuple[bool, bool]:
    """
    Determine if cloud data should be imported.
    Returns: (should_import, is_conflict)
    """
    if local_record is None:
        # No local record, always import
        return True, False
    
    if strategy == "keep_cloud":
        return True, True
    
    if strategy == "keep_local":
        return False, True
    
    if strategy == "keep_newer":
        local_ts = _get_timestamp_for_record(
            record_type, {
                "id": local_record.id,
                "type": local_record.type if hasattr(local_record, "type") else None,
                "label": local_record.label if hasattr(local_record, "label") else None,
                "startedAt": local_record.started_at if hasattr(local_record, "started_at") else None,
                "completedAt": local_record.completed_at if hasattr(local_record, "completed_at") else None,
                "createdAt": local_record.created_at if hasattr(local_record, "created_at") else None,
            }
        )
        cloud_ts = _get_timestamp_for_record(record_type, cloud_data)
        if cloud_ts > local_ts:
            return True, True
        return False, False

    return False, True


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


@router.get("/sync/info", response_model=SyncInfoResult)
async def sync_info(
    creds: SyncCredentials, db: AsyncSession = Depends(get_session)
):
    """Get sync metadata without downloading data."""
    def _download_metadata() -> dict:
        client = _build_blob_client(creds)
        try:
            raw = client.download_blob().readall()
            payload = json.loads(raw)
            return {
                "version": payload.get("version", 1),
                "exportedAt": payload.get("exportedAt"),
                "sessionCount": len(payload.get("sessions", [])),
                "taskCount": len(payload.get("tasks", [])),
            }
        except Exception:
            return {"version": 1, "exportedAt": None, "sessionCount": 0, "taskCount": 0}

    try:
        metadata = await asyncio.to_thread(_download_metadata)
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Azure download failed: {e}"
        ) from e

    return SyncInfoResult(
        ok=True,
        version=metadata["version"],
        exportedAt=metadata["exportedAt"],
        sessionCount=metadata["sessionCount"],
        taskCount=metadata["taskCount"],
    )


@router.post("/sync/pull/preview", response_model=PullPreviewResult)
async def pull_preview(
    request: SyncPullRequest, db: AsyncSession = Depends(get_session)
):
    """Preview what would be imported during a pull (no changes made)."""
    def _download() -> bytes:
        client = _build_blob_client(request)
        return client.download_blob().readall()

    try:
        raw = await asyncio.to_thread(_download)
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Azure download failed: {e}"
        ) from e

    try:
        payload = SyncPayload.model_validate(json.loads(raw))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail="Invalid sync file format") from e
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid sync payload: {e}") from e

    if payload.version != 1:
        raise HTTPException(status_code=422, detail="Unsupported sync payload version")

    # Get existing local IDs
    sessions_result = await db.execute(select(SessionRecord))
    tasks_result = await db.execute(select(KanbanTask))
    local_sessions = {s.id: s for s in sessions_result.scalars().all()}
    local_tasks = {t.id: t for t in tasks_result.scalars().all()}

    # Analyze cloud payload
    new_sessions = 0
    updated_sessions = 0
    new_tasks = 0
    updated_tasks = 0
    conflict_count = 0

    for s in payload.sessions:
        if s.id in local_sessions:
            updated_sessions += 1
            conflict_count += 1
        else:
            new_sessions += 1

    for t in payload.tasks:
        if t.id in local_tasks:
            updated_tasks += 1
            conflict_count += 1
        else:
            new_tasks += 1

    return PullPreviewResult(
        ok=True,
        newSessions=new_sessions,
        newTasks=new_tasks,
        updatedSessions=updated_sessions,
        updatedTasks=updated_tasks,
        conflictCount=conflict_count,
    )


@router.post("/sync/pull", response_model=PullResult)
async def pull_sync(
    request: SyncPullRequest,
    db: AsyncSession = Depends(get_session)
):
    """Download JSON from Azure Blob Storage and merge with local data.
    
    By default, uses merge strategy (preserves local data, imports new cloud data).
    Set merge=false to replace all local data (original behavior).
    """
    merge = request.merge
    conflict_strategy = request.conflictStrategy

    def _download() -> bytes:
        client = _build_blob_client(request)
        return client.download_blob().readall()

    try:
        raw = await asyncio.to_thread(_download)
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Azure download failed: {e}"
        ) from e

    try:
        payload = SyncPayload.model_validate(json.loads(raw))
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail="Invalid sync file format") from e
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid sync payload: {e}") from e

    if payload.version != 1:
        raise HTTPException(status_code=422, detail="Unsupported sync payload version")

    try:
        if merge:
            # Merge strategy: preserve local data, import new/updated from cloud
            imported_sessions = 0
            imported_tasks = 0
            merged_sessions = 0
            merged_tasks = 0
            conflicts = 0

            async with db.begin():
                # Get existing records
                sessions_result = await db.execute(select(SessionRecord))
                tasks_result = await db.execute(select(KanbanTask))
                local_sessions = {s.id: s for s in sessions_result.scalars().all()}
                local_tasks = {t.id: t for t in tasks_result.scalars().all()}

                # Process sessions
                for s_data in payload.sessions:
                    local = local_sessions.get(s_data.id)
                    should_import, is_conflict = _resolve_conflict(
                        local, s_data.model_dump(), conflict_strategy, "session"
                    )
                    
                    if is_conflict:
                        conflicts += 1
                    
                    if should_import:
                        if local is None:
                            imported_sessions += 1
                        else:
                            merged_sessions += 1
                        
                        record = SessionRecord(
                            id=s_data.id,
                            type=s_data.type,
                            label=s_data.label,
                            started_at=s_data.startedAt,
                            completed_at=s_data.completedAt,
                            duration=s_data.duration,
                        )
                        await db.merge(record)

                # Process tasks
                for t_data in payload.tasks:
                    local = local_tasks.get(t_data.id)
                    should_import, is_conflict = _resolve_conflict(
                        local, t_data.model_dump(), conflict_strategy, "task"
                    )
                    
                    if is_conflict:
                        conflicts += 1
                    
                    if should_import:
                        if local is None:
                            imported_tasks += 1
                        else:
                            merged_tasks += 1
                        
                        task = KanbanTask(
                            id=t_data.id,
                            title=t_data.title,
                            status=t_data.status,
                            pomodoros_completed=t_data.pomodorosCompleted,
                            created_at=t_data.createdAt,
                            completed_at=t_data.completedAt,
                        )
                        await db.merge(task)
        else:
            # Original behavior: replace all local data
            imported_sessions = 0
            imported_tasks = 0
            merged_sessions = 0
            merged_tasks = 0
            conflicts = 0

            async with db.begin():
                await db.execute(delete(SessionRecord))
                await db.execute(delete(KanbanTask))

                for s in payload.sessions:
                    imported_sessions += 1
                    await db.merge(
                        SessionRecord(
                            id=s.id,
                            type=s.type,
                            label=s.label,
                            started_at=s.startedAt,
                            completed_at=s.completedAt,
                            duration=s.duration,
                        )
                    )

                for t in payload.tasks:
                    imported_tasks += 1
                    await db.merge(
                        KanbanTask(
                            id=t.id,
                            title=t.title,
                            status=t.status,
                            pomodoros_completed=t.pomodorosCompleted,
                            created_at=t.createdAt,
                            completed_at=t.completedAt,
                        )
                    )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to apply sync payload: {e}") from e

    if merge:
        return PullResult(
            ok=True,
            importedSessions=imported_sessions,
            importedTasks=imported_tasks,
            mergedSessions=merged_sessions,
            mergedTasks=merged_tasks,
            conflicts=conflicts,
        )
    else:
        return PullResult(
            ok=True,
            importedSessions=imported_sessions,
            importedTasks=imported_tasks,
        )
