"""SQLModel table models for sessions and kanban tasks."""

from typing import Optional

from sqlmodel import Field, SQLModel


class SessionRecord(SQLModel, table=True):
    """A completed Pomodoro session."""

    __tablename__ = "sessions"

    id: str = Field(primary_key=True)
    type: str  # 'focus' | 'short-break' | 'long-break'
    label: str = Field(default="")
    started_at: int  # Unix timestamp ms
    completed_at: int  # Unix timestamp ms
    duration: int  # seconds


class KanbanTask(SQLModel, table=True):
    """A kanban board task."""

    __tablename__ = "kanban_tasks"

    id: str = Field(primary_key=True)
    title: str
    status: str  # 'todo' | 'in-progress' | 'done'
    pomodoros_completed: int = Field(default=0)
    created_at: int  # Unix timestamp ms
    completed_at: Optional[int] = Field(default=None)
