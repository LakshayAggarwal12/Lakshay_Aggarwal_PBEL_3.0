"""
Routes for the database-backed skills taxonomy — browsing the dataset,
extending it, and field detection. This is what turns the old static JSON
skills file into an actual queryable dataset the backend (and eventually
an admin UI) can read and write.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import JobField, Skill, SkillCategory, SkillFieldRelevance
from app.nlp.field_detector import detect_fields
from app.nlp.skill_extractor import refresh_taxonomy_cache
from app.schemas.schemas import (
    FieldDetectionResultOut,
    JobFieldOut,
    SkillCreateIn,
    SkillOut,
)

router = APIRouter(prefix="/api", tags=["skills"])


@router.get("/skills", response_model=list[SkillOut])
def list_skills(
    category: str | None = Query(None, description="Filter by category name"),
    field: str | None = Query(None, description="Filter by job field name"),
    db: Session = Depends(get_db),
):
    query = db.query(Skill)

    if category:
        query = query.join(SkillCategory).filter(SkillCategory.name == category)

    if field:
        query = (
            query.join(SkillFieldRelevance)
            .join(JobField)
            .filter(JobField.name == field)
        )

    skills = query.order_by(Skill.canonical_name).all()
    return [SkillOut.from_orm_with_category(s) for s in skills]


@router.post("/skills", response_model=SkillOut, status_code=201)
def create_skill(payload: SkillCreateIn, db: Session = Depends(get_db)):
    """
    Adds a new skill to the dataset — this is how the taxonomy grows over
    time without touching code or redeploying. Upserts by canonical name.
    """
    existing = db.query(Skill).filter_by(canonical_name=payload.canonical_name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Skill '{payload.canonical_name}' already exists.")

    category = db.query(SkillCategory).filter_by(name=payload.category).first()
    if not category:
        category = SkillCategory(name=payload.category)
        db.add(category)
        db.flush()

    skill = Skill(canonical_name=payload.canonical_name, aliases=payload.aliases, category_id=category.id)
    db.add(skill)
    db.flush()

    for fw in payload.fields:
        field = db.query(JobField).filter_by(name=fw.field).first()
        if not field:
            raise HTTPException(status_code=400, detail=f"Unknown field '{fw.field}'. Check GET /api/fields.")
        db.add(SkillFieldRelevance(skill_id=skill.id, field_id=field.id, weight=fw.weight))

    db.commit()
    db.refresh(skill)

    # Extraction uses an in-memory cache built from this table — without
    # this, a newly added skill wouldn't be detected in any resume/JD until
    # the server restarted.
    refresh_taxonomy_cache()

    return SkillOut.from_orm_with_category(skill)


@router.post("/skills/refresh")
def refresh_skills_cache():
    """
    Manually rebuilds the in-memory skill-matching cache. Needed if skills
    were added directly via scripts/seed_skills.py while the server was
    already running, rather than through POST /api/skills.
    """
    refresh_taxonomy_cache()
    return {"status": "refreshed"}


@router.get("/fields", response_model=list[JobFieldOut])
def list_fields(db: Session = Depends(get_db)):
    return db.query(JobField).order_by(JobField.name).all()


@router.get("/fields/{field_id}/skills", response_model=list[SkillOut])
def get_field_skills(field_id: int, db: Session = Depends(get_db)):
    field = db.get(JobField, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    skills = (
        db.query(Skill)
        .join(SkillFieldRelevance)
        .filter(SkillFieldRelevance.field_id == field_id)
        .order_by(SkillFieldRelevance.weight.desc())
        .all()
    )
    return [SkillOut.from_orm_with_category(s) for s in skills]


@router.get("/candidates/{candidate_id}/detected-field", response_model=list[FieldDetectionResultOut])
def detect_candidate_field(candidate_id: int, db: Session = Depends(get_db)):
    from app.models.models import Candidate

    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return detect_fields(candidate.extracted_skills)


@router.get("/job-descriptions/{jd_id}/detected-field", response_model=list[FieldDetectionResultOut])
def detect_jd_field(jd_id: int, db: Session = Depends(get_db)):
    from app.models.models import JobDescription

    jd = db.get(JobDescription, jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    return detect_fields(jd.required_skills)
