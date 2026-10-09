import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from app.config import settings
from app.database.base import Base

logger = logging.getLogger("aihc.database")

engine = None
AsyncSessionLocal = None
ACTIVE_DB_TYPE = "sqlite"

async def get_or_create_engine():
    global engine, AsyncSessionLocal, ACTIVE_DB_TYPE
    if engine is not None:
        return engine

    # Try PostgreSQL first
    pg_url = settings.DATABASE_URL
    sqlite_url = settings.SQLITE_FALLBACK_URL

    try:
        logger.info(f"Attempting connection to Primary PostgreSQL Database: {pg_url}")
        test_engine = create_async_engine(
            pg_url,
            echo=False,
            pool_pre_ping=True,
            connect_args={"timeout": 3} if "postgresql" in pg_url else {}
        )
        async with test_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        
        engine = test_engine
        ACTIVE_DB_TYPE = "postgresql"
        logger.info("Successfully connected to PostgreSQL database.")
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed ({e}). Falling back to local SQLite engine ({sqlite_url}).")
        engine = create_async_engine(
            sqlite_url,
            echo=False,
            connect_args={"check_same_thread": False}
        )
        ACTIVE_DB_TYPE = "sqlite"
        logger.info(f"Initialized SQLite database at {sqlite_url}.")

    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
    return engine

@asynccontextmanager
async def get_session_context() -> AsyncGenerator[AsyncSession, None]:
    global AsyncSessionLocal
    if AsyncSessionLocal is None:
        await get_or_create_engine()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with get_session_context() as session:
        yield session
