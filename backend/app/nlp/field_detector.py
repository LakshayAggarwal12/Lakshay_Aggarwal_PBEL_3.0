"""
Given a list of extracted skills, ranks job fields by how strongly those
skills point toward each one. Purely a weighted-sum over the
SkillFieldRelevance table — same "explainable, not a black box" philosophy
as the ATS checker: every score is traceable to which skills contributed
and by how much.
"""
from app.database import SessionLocal
from app.models.models import Skill


def detect_fields(skills: list[str], top_n: int = 3) -> list[dict]:
    """
    Returns up to top_n fields as [{"field": str, "score": float,
    "confidence": float, "contributing_skills": [str]}], sorted by score
    descending. confidence is score normalized against the top result (1.0
    for the top field). Returns [] if none of the given skills have any
    field associations in the dataset.
    """
    if not skills:
        return []

    db = SessionLocal()
    try:
        rows = db.query(Skill).filter(Skill.canonical_name.in_(skills)).all()

        field_scores: dict[str, float] = {}
        field_contributors: dict[str, list[str]] = {}

        for skill in rows:
            for rel in skill.field_relevance:
                field_name = rel.field.name
                field_scores[field_name] = field_scores.get(field_name, 0.0) + rel.weight
                field_contributors.setdefault(field_name, []).append(skill.canonical_name)

        if not field_scores:
            return []

        max_score = max(field_scores.values())
        ranked = sorted(field_scores.items(), key=lambda x: -x[1])[:top_n]

        return [
            {
                "field": name,
                "score": round(score, 2),
                "confidence": round(score / max_score, 2),
                "contributing_skills": sorted(field_contributors[name]),
            }
            for name, score in ranked
        ]
    finally:
        db.close()
