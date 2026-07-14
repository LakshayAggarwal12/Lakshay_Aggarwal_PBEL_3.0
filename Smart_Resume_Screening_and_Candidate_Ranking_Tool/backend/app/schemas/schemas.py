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


class CandidateListItemOut(CandidateOut):
    """
    Same shape as CandidateOut plus the candidate's most recent ATS report,
    nested — mirrors what /api/upload-resume already returns so the
    frontend's candidate cards work identically whether the candidate came
    from an upload response or from this list endpoint.
    """
    ats_report: ATSReportOut | None = None


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
    suggestions: list[str] = []
    created_at: datetime


class JobDescriptionIn(BaseModel):
    title: str
    raw_text: str


class JobDescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    raw_text: str
    required_skills: list[str]
    created_at: datetime


class RankingResultOut(BaseModel):
    candidate_id: int
    filename: str
    full_name: str | None
    semantic_similarity: float
    skill_overlap_pct: float
    composite_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    suggestions: list[str]


class RankingResponseOut(BaseModel):
    job_description_id: int
    job_title: str
    total_candidates: int
    rankings: list[RankingResultOut]


# ---- Skills taxonomy schemas ----

class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    canonical_name: str
    aliases: list[str]
    category: str | None = None

    @classmethod
    def from_orm_with_category(cls, skill):
        return cls(
            id=skill.id,
            canonical_name=skill.canonical_name,
            aliases=skill.aliases or [],
            category=skill.category.name if skill.category else None,
        )


class SkillFieldWeightIn(BaseModel):
    field: str
    weight: float = 1.0


class SkillCreateIn(BaseModel):
    canonical_name: str
    category: str
    aliases: list[str] = []
    fields: list[SkillFieldWeightIn] = []


class JobFieldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None


class FieldDetectionResultOut(BaseModel):
    field: str
    score: float
    confidence: float
    contributing_skills: list[str]
