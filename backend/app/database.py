"""Async SQLite database setup via SQLModel + aiosqlite."""

import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

# Allow override via env var so tests can use :memory: or a temp path
_DB_PATH = os.environ.get("POMOTRACK_DB_PATH", "/data/pomotrack.db")
_DB_URL = f"sqlite+aiosqlite:///{_DB_PATH}"

engine = create_async_engine(
    _DB_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def create_db_and_tables() -> None:
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session
