"""
FastAPI application entrypoint.

Run locally with:  uvicorn app.main:app --reload
Swagger docs at:    http://localhost:8000/docs
"""
from app.routes import rank, upload
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routes import skills

settings = get_settings()

# Day 1: create tables directly from models. Swap for Alembic migrations
# before this touches a real production database.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Resume Screening & Candidate Ranking API",
    description="Parses resumes, extracts structured data, checks ATS "
    "parseability, and ranks candidates against job descriptions.",
    version="0.1.0",
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
    return {"status": "ok", "env": settings.app_env}
