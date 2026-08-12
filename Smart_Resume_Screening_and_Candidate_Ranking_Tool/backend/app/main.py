"""
FastAPI application entrypoint.

Run locally with:
    uvicorn app.main:app --reload

Swagger docs:
    http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routes import rank, upload, skills
from scripts.seed_skills import seed_if_empty


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs when the FastAPI application starts and shuts down.
    """

    print("Starting application...")
    print("Initializing database...")

    try:
        # Create tables if they don't already exist.
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized.")

        # Seed skill taxonomy only if the skills table is empty.
        seeded = seed_if_empty()

        if seeded:
            print("Seeded skills taxonomy because the database was empty.")
        else:
            print("Skills taxonomy already exists. Skipping seed.")

        print("Database initialization completed.")

    except Exception as e:
        print(f"Database initialization failed: {e}")
        raise

    yield

    print("Application shutting down...")


app = FastAPI(
    title="Smart Resume Screening & Candidate Ranking API",
    description=(
        "Parses resumes, extracts structured data, checks ATS "
        "parseability, and ranks candidates against job descriptions."
    ),
    version="0.1.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(upload.router)
app.include_router(rank.router)
app.include_router(skills.router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "env": settings.app_env,
    }