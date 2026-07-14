"""
Skill extraction engine.

Deliberately uses a curated taxonomy + spaCy PhraseMatcher instead of raw
NER. Generic NER models are unreliable at picking "React.js" or "CI/CD" out
of resume text — a matched vocabulary is far more precise for this domain,
and it's what production ATS-style tools actually do.

The taxonomy now lives in the database (Skill/SkillCategory tables — see
app/models/models.py and scripts/seed_skills.py), not a static JSON file.
Run scripts/seed_skills.py once before extraction will find anything.
"""
import re
import sys
from functools import lru_cache

import spacy
from spacy.matcher import PhraseMatcher

from app.database import SessionLocal
from app.models.models import Skill

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(\+?\d{1,3}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}")
# Matches "3+ years", "2 years of experience", "5-7 years" etc.
EXPERIENCE_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:-\s*\d+\s*)?year[s]?\s*(?:of)?\s*(?:experience|exp)?",
    re.IGNORECASE,
)

EDUCATION_KEYWORDS = [
    "B.Tech", "B.E.", "Bachelor", "M.Tech", "M.E.", "Master",
    "B.Sc", "M.Sc", "MBA", "PhD", "Diploma", "BCA", "MCA",
]


@lru_cache
def _load_taxonomy() -> dict[str, str]:
    """
    Returns {lowercased phrase: canonical skill name}, covering both each
    skill's canonical name and all of its aliases — so "ReactJS" and
    "React.js" both resolve to the single canonical skill "React" instead
    of being treated as separate skills, which is an improvement over the
    old static-JSON version where every alias was its own distinct entry.
    """
    db = SessionLocal()
    try:
        rows = db.query(Skill).all()
        if not rows:
            print(
                "WARNING: skills table is empty — skill extraction will find "
                "nothing until you run scripts/seed_skills.py",
                file=sys.stderr,
            )
        phrase_to_canonical: dict[str, str] = {}
        for row in rows:
            phrase_to_canonical[row.canonical_name.lower()] = row.canonical_name
            for alias in (row.aliases or []):
                phrase_to_canonical[alias.lower()] = row.canonical_name
        return phrase_to_canonical
    finally:
        db.close()


@lru_cache
def _get_nlp():
    # Loaded once per process (lru_cache) — loading spaCy models is expensive,
    # never do this per-request.
    return spacy.load("en_core_web_sm")


@lru_cache
def _get_matcher() -> PhraseMatcher:
    nlp = _get_nlp()
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    patterns = [nlp.make_doc(phrase) for phrase in _load_taxonomy().keys()]
    matcher.add("SKILLS", patterns)
    return matcher


def refresh_taxonomy_cache() -> None:
    """
    Call after adding/editing skills via the API so extraction picks up the
    change without restarting the server. Wired to POST /api/skills/refresh.
    """
    _load_taxonomy.cache_clear()
    _get_matcher.cache_clear()


def extract_skills(text: str) -> list[str]:
    """Returns the canonical skill names found in text."""
    if not text.strip():
        return []

    nlp = _get_nlp()
    matcher = _get_matcher()
    doc = nlp(text)
    matches = matcher(doc)

    phrase_to_canonical = _load_taxonomy()
    found = set()
    for _, start, end in matches:
        span_text = doc[start:end].text.lower()
        if span_text in phrase_to_canonical:
            found.add(phrase_to_canonical[span_text])

    return sorted(found)


def extract_contact_info(text: str) -> dict[str, str | None]:
    email_match = EMAIL_RE.search(text)
    phone_match = PHONE_RE.search(text)
    return {
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0).strip() if phone_match else None,
    }


def extract_education(text: str) -> list[str]:
    found = []
    for keyword in EDUCATION_KEYWORDS:
        if re.search(re.escape(keyword), text, re.IGNORECASE):
            found.append(keyword)
    return found


def extract_experience_years(text: str) -> float | None:
    """
    Best-effort extraction: finds all "X years" mentions and returns the max.
    This is intentionally simple for Day 1 — good enough for ranking context,
    not a precise work-history parser.
    """
    matches = EXPERIENCE_RE.findall(text)
    years = [float(m) for m in matches if m]
    return max(years) if years else None


def extract_name(text: str, filename: str) -> str | None:
    """
    Heuristic: assume the candidate's name is on the first non-empty line
    if it looks like a name (2-4 title-case words, no digits/@ symbols).
    Falls back to None — better an honest gap than a wrong guess.
    """
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if "@" in line or any(char.isdigit() for char in line):
            continue
        words = line.split()
        if 1 < len(words) <= 4 and all(w[0].isupper() for w in words if w):
            return line
        break  # only ever consider the first non-empty line
    return None
