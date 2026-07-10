"""
Pydantic schemas — these define the API's public contract, separate from the
ORM models so internal DB structure can change without breaking the API.
"""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CandidateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    full_name: str | None
    email: str | None
    phone: str | None
    extracted_skills: list[str]
    education: list[str]
    experience_years: float | None
    created_at: datetime


class ATSCheckItem(BaseModel):
    name: str
    passed: bool
    message: str
    weight: int


class ATSReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    overall_score: float
    checks: list[ATSCheckItem]
    suggestions: list[str]
    created_at: datetime


class MatchScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    job_description_id: int
    semantic_similarity: float
    skill_overlap_pct: float
    composite_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    created_at: datetime


class JobDescriptionIn(BaseModel):
    title: str
    raw_text: str
