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
