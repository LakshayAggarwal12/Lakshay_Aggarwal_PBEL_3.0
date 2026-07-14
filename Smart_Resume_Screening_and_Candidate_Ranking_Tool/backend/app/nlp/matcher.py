"""
JD-matching engine.

Combines two independent signals into one composite ranking score:
  1. Content similarity  — does the resume's overall content overlap with
     the JD's vocabulary? (TF-IDF + cosine similarity)
  2. Skill overlap        — of the skills explicitly required by the JD,
     what % does this candidate actually have? (exact taxonomy match)

NOTE ON APPROACH: this uses TF-IDF (term-frequency vocabulary matching) via
scikit-learn rather than transformer sentence embeddings
(sentence-transformers/torch). That's a deliberate memory tradeoff, not an
oversight — torch's runtime memory footprint (400-600MB+) doesn't fit
comfortably on free-tier hosting (e.g. Render's 512MB limit), and this
avoids that entirely with no cost and no external API calls. The real
tradeoff: TF-IDF matches on shared vocabulary, not meaning — it won't
recognize that "built REST APIs" and "backend development experience" are
related since they share almost no literal words. For resume-vs-JD
matching specifically this is a softer loss than it sounds, since resumes
and JDs both lean heavily on literal tech/skill terms, which is exactly
what TF-IDF is good at. If memory constraints go away later (paid hosting,
a bigger instance), swapping back to sentence-transformers is a
self-contained change to compute_semantic_similarity() below — nothing
else in this file or its callers needs to change, since the function
signature and 0-100 output scale stay identical either way.

Kept as two separate numbers (not just one blended score) because they
answer different questions for the reader: content similarity tells you
"is this person's experience in the right domain," skill overlap tells you
"do they tick the specific boxes." A resume can be high on one and low on
the other, and that distinction is useful, not noise.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.nlp.skill_extractor import extract_skills

# Weights for the composite score. Skill overlap weighted higher than
# content similarity here — with TF-IDF (vocabulary-based, not meaning-
# based), exact skill matches are a more reliable signal than the general
# content-overlap score.
SEMANTIC_WEIGHT = 0.5
SKILL_OVERLAP_WEIGHT = 0.5


def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    """
    Returns a 0-100 score for how similar the two texts are, via TF-IDF +
    cosine similarity. Named compute_semantic_similarity (not
    compute_content_similarity) to keep the function signature/name stable
    for every caller — only the internal implementation changed.
    """
    if not resume_text.strip() or not jd_text.strip():
        return 0.0

    vectorizer = TfidfVectorizer(stop_words="english", max_features=2000)
    try:
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
    except ValueError:
        # Happens if, after stop-word removal, there's no vocabulary left
        # in common (e.g. both texts are extremely short or all stop words)
        return 0.0

    raw_similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
    return round(max(0.0, min(1.0, float(raw_similarity))) * 100, 1)


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
