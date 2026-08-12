"""
Populates SkillCategory, Skill, JobField, and SkillFieldRelevance
from app.data.skills_seed.py.

Idempotent:
- Existing records are reused.
- New skills are added.
- Updated aliases/categories are synchronized.
- Safe to run multiple times.

Usage from backend directory:

    python -m scripts.seed_skills
"""

import sys
from pathlib import Path


# Allow this script to be executed directly.
sys.path.insert(
    0,
    str(Path(__file__).resolve().parent.parent)
)


from app.data.skills_seed import CATEGORIES, FIELDS, SKILLS
from app.database import Base, SessionLocal, engine
from app.models.models import (
    JobField,
    Skill,
    SkillCategory,
    SkillFieldRelevance,
)


def seed():
    """
    Populate the database with the predefined skill taxonomy.

    Tables must already exist before calling this function.
    """

    db = SessionLocal()

    try:
        # ---------------------------------------------------------
        # Categories
        # ---------------------------------------------------------

        category_map = {}

        for name in CATEGORIES:
            existing = (
                db.query(SkillCategory)
                .filter_by(name=name)
                .first()
            )

            if not existing:
                existing = SkillCategory(name=name)
                db.add(existing)
                db.flush()

            category_map[name] = existing

        print(f"{len(category_map)} categories ready.")


        # ---------------------------------------------------------
        # Job fields
        # ---------------------------------------------------------

        field_map = {}

        for field in FIELDS:
            existing = (
                db.query(JobField)
                .filter_by(name=field["name"])
                .first()
            )

            if not existing:
                existing = JobField(
                    name=field["name"],
                    description=field["description"],
                )

                db.add(existing)
                db.flush()

            field_map[field["name"]] = existing

        print(f"{len(field_map)} job fields ready.")


        # ---------------------------------------------------------
        # Skills + field relevance
        # ---------------------------------------------------------

        skill_count = 0
        relevance_count = 0

        for name, (category_name, aliases, fields) in SKILLS.items():

            skill = (
                db.query(Skill)
                .filter_by(canonical_name=name)
                .first()
            )

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
                # Keep aliases and category synchronized
                # with the seed file.
                skill.aliases = aliases
                skill.category_id = category_map[category_name].id


            # -----------------------------------------------------
            # Skill → Job Field relevance
            # -----------------------------------------------------

            for field_name, weight in fields.items():

                existing_rel = (
                    db.query(SkillFieldRelevance)
                    .filter_by(
                        skill_id=skill.id,
                        field_id=field_map[field_name].id,
                    )
                    .first()
                )

                if existing_rel:
                    existing_rel.weight = weight

                else:
                    db.add(
                        SkillFieldRelevance(
                            skill_id=skill.id,
                            field_id=field_map[field_name].id,
                            weight=weight,
                        )
                    )

                    relevance_count += 1


        # Commit everything together.
        db.commit()

        print(
            f"{skill_count} new skill(s) added "
            f"({len(SKILLS)} total in seed file)."
        )

        print(
            f"{relevance_count} new field-relevance mapping(s) added."
        )

        print("Seeding completed successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def seed_if_empty() -> bool:
    """
    Seed the taxonomy only when the Skill table is empty.

    Returns:
        True  -> seeding happened
        False -> database already contained skills
    """

    db = SessionLocal()

    try:
        existing_skill = db.query(Skill).first()

        if existing_skill:
            return False

    finally:
        db.close()


    # Tables are created by main.py before this function is called.
    seed()

    return True


if __name__ == "__main__":
    # This script is also safe to execute manually:
    #
    # python -m scripts.seed_skills
    #
    # In standalone mode we create the tables first because
    # FastAPI's lifespan is not running.

    Base.metadata.create_all(bind=engine)

    seed()