import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database.session import get_or_create_engine, get_session_context, ACTIVE_DB_TYPE
from app.database.base import Base
from app.database.seed import seed_database
import app.models # Ensure all models are registered
from app.api.v1.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aihc")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize engine, tables and seed
    logger.info("Starting AI Healthcare Case-Taking Backend...")
    engine = await get_or_create_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN patient_details JSON"))
        except Exception:
            pass # Already exists or not supported
    logger.info(f"Database schema verified using engine ({ACTIVE_DB_TYPE}).")

    # Run seed in async session
    async with get_session_context() as session:
        await seed_database(session)
    logger.info("Database seeding completed.")

    yield

    # Shutdown
    if engine:
        await engine.dispose()
    logger.info("AI Healthcare Backend shutdown cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI Backend for AI Hospital Patient Case-Taking System with PostgreSQL, AI Pre-Consultation, and OCR Summarizer.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)
from app.api.v1.endpoints import preconsultation
app.include_router(preconsultation.router, prefix="/api/preconsultation", tags=["preconsultation"])

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "api": settings.API_V1_STR,
        "database": ACTIVE_DB_TYPE
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": ACTIVE_DB_TYPE}
