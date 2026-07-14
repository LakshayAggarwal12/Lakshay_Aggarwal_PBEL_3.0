"""
Populates SkillCategory, Skill, JobField, and SkillFieldRelevance from
app/data/skills_seed.py. Idempotent — upserts by name, safe to re-run after
adding new skills to the seed file.

Usage (from backend/ directory):
    python -m scripts.seed_skills
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from Smart_Resme_Screening_and_Candidate_Ranking_Tool.backend.app.data.skills_seed import CATEGORIES, FIELDS, SKILLS
from Smart_Resme_Screening_and_Candidate_Ranking_Tool.backend.app.database import Base, SessionLocal, engine
from Smart_Resme_Screening_and_Candidate_Ranking_Tool.backend.app.models.models import JobField, Skill, SkillCategory, SkillFieldRelevance


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Categories
        category_map = {}
        for name in CATEGORIES:
            existing = db.query(SkillCategory).filter_by(name=name).first()
            if not existing:
                existing = SkillCategory(name=name)
                db.add(existing)
                db.flush()
            category_map[name] = existing
        print(f"{len(category_map)} categories ready.")

        # Fields
        field_map = {}
        for f in FIELDS:
            existing = db.query(JobField).filter_by(name=f["name"]).first()
            if not existing:
                existing = JobField(name=f["name"], description=f["description"])
                db.add(existing)
                db.flush()
            field_map[f["name"]] = existing
        print(f"{len(field_map)} job fields ready.")

        # Skills + field relevance
        skill_count = 0
        relevance_count = 0
        for name, (category_name, aliases, fields) in SKILLS.items():
            skill = db.query(Skill).filter_by(canonical_name=name).first()
            if not skill:
                skill = Skill(
                    canonical_name=name,
                    aliases=aliases,
                    category_id=category_map[category_name].id,
                )
                db.add(skill)
                db.flush()
                skill_count += 1
            else:
                # Keep aliases/category in sync if the seed file changed
                skill.aliases = aliases
                skill.category_id = category_map[category_name].id

            for field_name, weight in fields.items():
                existing_rel = (
                    db.query(SkillFieldRelevance)
                    .filter_by(skill_id=skill.id, field_id=field_map[field_name].id)
                    .first()
                )
                if existing_rel:
                    existing_rel.weight = weight
                else:
                    db.add(SkillFieldRelevance(skill_id=skill.id, field_id=field_map[field_name].id, weight=weight))
                    relevance_count += 1

        db.commit()
        print(f"{skill_count} new skill(s) added ({len(SKILLS)} total in seed file).")
        print(f"{relevance_count} new field-relevance mapping(s) added.")
        print("\nDone.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
