"""
ORM models.

Design notes:
- Candidate stores parsed resume data ONCE; it's reused across multiple JD
  matches, so we don't re-parse the same PDF every time it's ranked.
- JobDescription is stored so past JDs can be revisited/re-run later.
- MatchScore is the join table between a Candidate and a JobDescription —
  this is what lets one candidate be ranked against many JDs without
  duplicating parsed resume data.
- ATSReport is JD-independent (parseability only), so it's tied to the
  Candidate directly, not to a MatchScore.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    extracted_skills: Mapped[list] = mapped_column(JSON, default=list)
    education: Mapped[list] = mapped_column(JSON, default=list)
    experience_years: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    match_scores: Mapped[list["MatchScore"]] = relationship(
        back_populates="candidate", cascade="all, delete-orphan"
    )
    ats_reports: Mapped[list["ATSReport"]] = relationship(
        back_populates="candidate", cascade="all, delete-orphan"
    )


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    match_scores: Mapped[list["MatchScore"]] = relationship(
        back_populates="job_description", cascade="all, delete-orphan"
    )


class MatchScore(Base):
    __tablename__ = "match_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    job_description_id: Mapped[int] = mapped_column(ForeignKey("job_descriptions.id"))

    semantic_similarity: Mapped[float] = mapped_column(Float)  # 0-100
    skill_overlap_pct: Mapped[float] = mapped_column(Float)  # 0-100
    composite_score: Mapped[float] = mapped_column(Float)  # weighted final, 0-100

    matched_skills: Mapped[list] = mapped_column(JSON, default=list)
    missing_skills: Mapped[list] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    candidate: Mapped["Candidate"] = relationship(back_populates="match_scores")
    job_description: Mapped["JobDescription"] = relationship(back_populates="match_scores")


class ATSReport(Base):
    __tablename__ = "ats_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))

    overall_score: Mapped[float] = mapped_column(Float)  # 0-100
    checks: Mapped[list] = mapped_column(JSON, default=list)  # list of {name, passed, message, weight}
    suggestions: Mapped[list] = mapped_column(JSON, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    candidate: Mapped["Candidate"] = relationship(back_populates="ats_reports")


# ---------------------------------------------------------------------------
# Skills taxonomy — this used to be a static JSON file (app/data/
# skills_taxonomy.json) loaded into memory. It's now a real dataset living
# in the database: a skill belongs to a category, can have alias spellings
# ("React.js"/"ReactJS"/"React"), and can be associated with one or more
# job fields with a relevance weight. This is what powers both skill
# extraction (skill_extractor.py builds its matcher from this table) and
# field detection (guessing whether a JD/resume is "Backend Development"
# vs "Data Science" etc. from weighted skill overlap).
# ---------------------------------------------------------------------------

class SkillCategory(Base):
    __tablename__ = "skill_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    skills: Mapped[list["Skill"]] = relationship(back_populates="category")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    canonical_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    # Alternate spellings that should all resolve to canonical_name during
    # extraction, e.g. ["ReactJS", "React.js"] for the skill "React".
    aliases: Mapped[list] = mapped_column(JSON, default=list)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("skill_categories.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    category: Mapped["SkillCategory | None"] = relationship(back_populates="skills")
    field_relevance: Mapped[list["SkillFieldRelevance"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan"
    )


class JobField(Base):
    __tablename__ = "job_fields"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    skill_relevance: Mapped[list["SkillFieldRelevance"]] = relationship(
        back_populates="field", cascade="all, delete-orphan"
    )


class SkillFieldRelevance(Base):
    """
    Many-to-many between Skill and JobField, weighted by how core that
    skill is to that field (0-1). E.g. "Python" might be 0.6 relevant to
    Backend Development and 0.9 relevant to Data Science.
    """
    __tablename__ = "skill_field_relevance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    field_id: Mapped[int] = mapped_column(ForeignKey("job_fields.id"))
    weight: Mapped[float] = mapped_column(Float, default=1.0)

    skill: Mapped["Skill"] = relationship(back_populates="field_relevance")
    field: Mapped["JobField"] = relationship(back_populates="skill_relevance")
