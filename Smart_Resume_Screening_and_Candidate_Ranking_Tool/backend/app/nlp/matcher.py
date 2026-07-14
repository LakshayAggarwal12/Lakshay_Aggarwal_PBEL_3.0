"""
JD-matching engine.

Combines two independent signals into one composite ranking score:
  1. Semantic similarity  — does the resume's overall content *mean* the
     same thing as the JD, even with different wording? (sentence embeddings)
  2. Skill overlap        — of the skills explicitly required by the JD,
     what % does this candidate actually have? (exact taxonomy match)

Kept as two separate numbers (not just one blended score) because they
answer different questions for the reader: semantic similarity tells you
"is this person's experience in the right domain," skill overlap tells you
"do they tick the specific boxes." A resume can be high on one and low on
the other, and that distinction is useful, not noise.
"""
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from app.nlp.skill_extractor import extract_skills

# Weights for the composite score. Semantic similarity weighted higher
# because it captures relevant experience described in different words
# (e.g. "built REST APIs" vs a JD asking for "backend development
# experience") that exact skill-matching alone would miss.
SEMANTIC_WEIGHT = 0.6
SKILL_OVERLAP_WEIGHT = 0.4

_MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache
def _get_model() -> SentenceTransformer:
    # Loaded once per process — loading the embedding model is expensive
    # (disk + memory), never do this per-request.
    return SentenceTransformer(_MODEL_NAME)


def _cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    denom = np.linalg.norm(vec_a) * np.linalg.norm(vec_b)
    if denom == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / denom)


def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    """Returns a 0-100 score for how semantically similar the two texts are."""
    model = _get_model()
    embeddings = model.encode([resume_text, jd_text])
    raw_similarity = _cosine_similarity(embeddings[0], embeddings[1])
    # Cosine similarity for sentence embeddings is typically in the 0-1
    # range for related text (rarely negative in practice for prose), so a
    # direct *100 scale is reasonable here rather than a min-max remap.
    return round(max(0.0, min(1.0, raw_similarity)) * 100, 1)


def compute_skill_overlap(candidate_skills: list[str], jd_skills: list[str]) -> dict:
    """
    Returns overlap percentage plus the matched/missing skill lists, so the
    UI can show exactly which required skills were found vs. absent —
    that breakdown is more useful to the reader than the percentage alone.
    """
    if not jd_skills:
        # No skills detected in the JD at all — overlap is undefined, not
        # zero. Returning 0 here would unfairly punish every candidate for
        # a JD that just didn't mention skills explicitly (e.g. a vague JD).
        return {"overlap_pct": 0.0, "matched": [], "missing": [], "jd_skills_found": False}

    candidate_set = {s.lower() for s in candidate_skills}
    jd_set_lower_to_canonical = {s.lower(): s for s in jd_skills}

    matched = [
        canonical
        for lower, canonical in jd_set_lower_to_canonical.items()
        if lower in candidate_set
    ]
    missing = [
        canonical
        for lower, canonical in jd_set_lower_to_canonical.items()
        if lower not in candidate_set
    ]

    overlap_pct = round((len(matched) / len(jd_skills)) * 100, 1)

    return {
        "overlap_pct": overlap_pct,
        "matched": sorted(matched),
        "missing": sorted(missing),
        "jd_skills_found": True,
    }


def compute_match(resume_text: str, candidate_skills: list[str], jd_text: str) -> dict:
    """
    Full JD-match computation for one candidate against one JD.
    Returns everything the API/DB layer needs in one shot.
    """
    jd_skills = extract_skills(jd_text)
    semantic_score = compute_semantic_similarity(resume_text, jd_text)
    overlap = compute_skill_overlap(candidate_skills, jd_skills)

    if overlap["jd_skills_found"]:
        composite = round(
            semantic_score * SEMANTIC_WEIGHT + overlap["overlap_pct"] * SKILL_OVERLAP_WEIGHT, 1
        )
    else:
        # If the JD has no extractable skills, fall back to semantic
        # similarity alone rather than silently dragging the score down
        # with a meaningless 0% overlap term.
        composite = semantic_score

    return {
        "semantic_similarity": semantic_score,
        "skill_overlap_pct": overlap["overlap_pct"],
        "composite_score": composite,
        "matched_skills": overlap["matched"],
        "missing_skills": overlap["missing"],
        "jd_required_skills": jd_skills,
    }


def rank_candidates(candidates: list[dict], jd_text: str) -> list[dict]:
    """
    candidates: list of {"candidate_id": int, "resume_text": str, "skills": list[str]}
    Returns the same candidates enriched with match data, sorted by
    composite_score descending (highest match first).
    """
    jd_skills = extract_skills(jd_text)  # computed once, reused for every candidate
    results = []
    for c in candidates:
        semantic_score = compute_semantic_similarity(c["resume_text"], jd_text)
        overlap = compute_skill_overlap(c["skills"], jd_skills)

        if overlap["jd_skills_found"]:
            composite = round(
                semantic_score * SEMANTIC_WEIGHT + overlap["overlap_pct"] * SKILL_OVERLAP_WEIGHT, 1
            )
        else:
            composite = semantic_score

        results.append({
            "candidate_id": c["candidate_id"],
            "semantic_similarity": semantic_score,
            "skill_overlap_pct": overlap["overlap_pct"],
            "composite_score": composite,
            "matched_skills": overlap["matched"],
            "missing_skills": overlap["missing"],
        })

    return sorted(results, key=lambda r: r["composite_score"], reverse=True)
