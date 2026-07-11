"""
Day 2 scope: submit a JD, rank every stored candidate against it, and
persist the results. Builds entirely on Day 1's stored Candidate rows —
no re-parsing or re-uploading needed.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Candidate, JobDescription, MatchScore
from app.nlp.matcher import rank_candidates
from app.nlp.skill_extractor import extract_skills
from app.nlp.suggestions import generate_match_suggestions
from app.schemas.schemas import (
    JobDescriptionIn,
    JobDescriptionOut,
    MatchScoreOut,
    RankingResponseOut,
    RankingResultOut,
)

router = APIRouter(prefix="/api", tags=["ranking"])


@router.post("/job-descriptions", response_model=JobDescriptionOut)
def create_job_description(payload: JobDescriptionIn, db: Session = Depends(get_db)):
    if not payload.raw_text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")

    required_skills = extract_skills(payload.raw_text)

    jd = JobDescription(
        title=payload.title,
        raw_text=payload.raw_text,
        required_skills=required_skills,
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


@router.get("/job-descriptions/{jd_id}", response_model=JobDescriptionOut)
def get_job_description(jd_id: int, db: Session = Depends(get_db)):
    jd = db.get(JobDescription, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return jd


@router.post("/job-descriptions/{jd_id}/rank", response_model=RankingResponseOut)
def rank_all_candidates(jd_id: int, db: Session = Depends(get_db)):
    """
    Ranks every candidate currently in the database against this JD.
    Persists a MatchScore row per candidate (upsert-style: replaces any
    prior score for this candidate+JD pair) and returns the full ranked list.
    """
    jd = db.get(JobDescription, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")

    candidates = db.query(Candidate).all()
    if not candidates:
        raise HTTPException(
            status_code=400,
            detail="No candidates found. Upload at least one resume before ranking.",
        )

    candidate_payload = [
        {"candidate_id": c.id, "resume_text": c.raw_text, "skills": c.extracted_skills}
        for c in candidates
    ]
    ranked = rank_candidates(candidate_payload, jd.raw_text)

    candidates_by_id = {c.id: c for c in candidates}
    results: list[RankingResultOut] = []

    for entry in ranked:
        candidate = candidates_by_id[entry["candidate_id"]]
        suggestions = generate_match_suggestions(
            entry["semantic_similarity"], entry["skill_overlap_pct"], entry["missing_skills"]
        )

        # Upsert: remove any previous score for this candidate+JD pair so
        # re-running a ranking doesn't accumulate duplicate rows.
        existing = (
            db.query(MatchScore)
            .filter_by(candidate_id=candidate.id, job_description_id=jd.id)
            .first()
        )
        if existing:
            db.delete(existing)
            db.flush()

        match = MatchScore(
            candidate_id=candidate.id,
            job_description_id=jd.id,
            semantic_similarity=entry["semantic_similarity"],
            skill_overlap_pct=entry["skill_overlap_pct"],
            composite_score=entry["composite_score"],
            matched_skills=entry["matched_skills"],
            missing_skills=entry["missing_skills"],
        )
        db.add(match)

        results.append(
            RankingResultOut(
                candidate_id=candidate.id,
                filename=candidate.filename,
                full_name=candidate.full_name,
                semantic_similarity=entry["semantic_similarity"],
                skill_overlap_pct=entry["skill_overlap_pct"],
                composite_score=entry["composite_score"],
                matched_skills=entry["matched_skills"],
                missing_skills=entry["missing_skills"],
                suggestions=suggestions,
            )
        )

    db.commit()

    return RankingResponseOut(
        job_description_id=jd.id,
        job_title=jd.title,
        total_candidates=len(results),
        rankings=results,
    )


@router.get("/candidates/{candidate_id}/match/{jd_id}", response_model=MatchScoreOut)
def get_match_score(candidate_id: int, jd_id: int, db: Session = Depends(get_db)):
    match = (
        db.query(MatchScore)
        .filter_by(candidate_id=candidate_id, job_description_id=jd_id)
        .first()
    )
    if not match:
        raise HTTPException(
            status_code=404,
            detail="No match score found for this candidate/JD pair. Run ranking first.",
        )

    suggestions = generate_match_suggestions(
        match.semantic_similarity, match.skill_overlap_pct, match.missing_skills
    )
    out = MatchScoreOut.model_validate(match)
    out.suggestions = suggestions
    return out
