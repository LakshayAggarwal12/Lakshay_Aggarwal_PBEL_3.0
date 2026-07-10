"""
Skill extraction engine.

Deliberately uses a curated taxonomy + spaCy PhraseMatcher instead of raw
NER. Generic NER models are unreliable at picking "React.js" or "CI/CD" out
of resume text — a matched vocabulary is far more precise for this domain,
and it's what production ATS-style tools actually do.
"""
import json
import re
from functools import lru_cache
from pathlib import Path

import spacy
from spacy.matcher import PhraseMatcher

TAXONOMY_PATH = Path(__file__).resolve().parent.parent / "data" / "skills_taxonomy.json"

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
def _load_taxonomy() -> dict[str, list[str]]:
    with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache
def _flat_skill_list() -> list[str]:
    taxonomy = _load_taxonomy()
    skills: list[str] = []
    for category_skills in taxonomy.values():
        skills.extend(category_skills)
    # de-dupe while preserving order
    seen = set()
    unique = []
    for s in skills:
        key = s.lower()
        if key not in seen:
            seen.add(key)
            unique.append(s)
    return unique


@lru_cache
def _get_nlp():
    # Loaded once per process (lru_cache) — loading spaCy models is expensive,
    # never do this per-request.
    return spacy.load("en_core_web_sm")


@lru_cache
def _get_matcher() -> PhraseMatcher:
    nlp = _get_nlp()
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    patterns = [nlp.make_doc(skill) for skill in _flat_skill_list()]
    matcher.add("SKILLS", patterns)
    return matcher


def extract_skills(text: str) -> list[str]:
    """Returns the canonical (taxonomy-cased) skill names found in text."""
    if not text.strip():
        return []

    nlp = _get_nlp()
    matcher = _get_matcher()
    doc = nlp(text)
    matches = matcher(doc)

    canonical_by_lower = {s.lower(): s for s in _flat_skill_list()}
    found = set()
    for _, start, end in matches:
        span_text = doc[start:end].text.lower()
        if span_text in canonical_by_lower:
            found.add(canonical_by_lower[span_text])

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
