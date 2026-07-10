"""
Day 1 scope: upload a resume, parse it, extract structured data, store it,
and run the ATS parseability check. JD matching/ranking is Day 2.
"""
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.models import ATSReport, Candidate
from app.nlp.ats_checker import run_ats_checks
from app.nlp.skill_extractor import (
    extract_contact_info,
    extract_education,
    extract_experience_years,
    extract_name,
    extract_skills,
)
from app.parsers.docx_parser import parse_docx
from app.parsers.pdf_parser import parse_pdf
from app.schemas.schemas import ATSReportOut, CandidateOut

router = APIRouter(prefix="/api", tags=["resumes"])
settings = get_settings()


@router.post("/upload-resume", response_model=dict)
async def upload_resume(file: UploadFile, db: Session = Depends(get_db)):
    ext = Path(file.filename).suffix.lower()
    if ext not in settings.extensions_list:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {settings.extensions_list}",
        )

    contents = await file.read()
    if len(contents) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {settings.max_upload_size_mb}MB limit.",
        )

    # Write to a temp file — pdfplumber/python-docx need a real file path
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        parsed = parse_pdf(tmp_path) if ext == ".pdf" else parse_docx(tmp_path)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    if not parsed.raw_text:
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted from this file. It may be a scanned "
            "image — try uploading a text-based PDF or DOCX.",
        )

    contact = extract_contact_info(parsed.raw_text)
    skills = extract_skills(parsed.raw_text)
    education = extract_education(parsed.raw_text)
    experience_years = extract_experience_years(parsed.raw_text)
    name = extract_name(parsed.raw_text, file.filename)

    candidate = Candidate(
        filename=file.filename,
        full_name=name,
        email=contact["email"],
        phone=contact["phone"],
        raw_text=parsed.raw_text,
        extracted_skills=skills,
        education=education,
        experience_years=experience_years,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    overall_score, checks, suggestions = run_ats_checks(parsed)
    ats_report = ATSReport(
        candidate_id=candidate.id,
        overall_score=overall_score,
        checks=[c.__dict__ for c in checks],
        suggestions=suggestions,
    )
    db.add(ats_report)
    db.commit()
    db.refresh(ats_report)

    return {
        "candidate": CandidateOut.model_validate(candidate).model_dump(),
        "ats_report": ATSReportOut.model_validate(ats_report).model_dump(),
    }


@router.get("/candidates/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.get("/candidates/{candidate_id}/ats-report", response_model=ATSReportOut)
def get_latest_ats_report(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not candidate.ats_reports:
        raise HTTPException(status_code=404, detail="No ATS report found for this candidate")
    return sorted(candidate.ats_reports, key=lambda r: r.created_at)[-1]
