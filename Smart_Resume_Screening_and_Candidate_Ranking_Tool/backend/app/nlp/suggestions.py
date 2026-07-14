"""
Suggestions engine for JD-match results.

Separate from ats_checker.py's suggestions because these are JD-specific
(what to improve *for this particular job*), while ATS suggestions are
format-level and JD-independent. Keeping them apart means a candidate can
have a perfect ATS score but still get useful, targeted "you're missing
these skills for this JD" feedback.
"""


def generate_match_suggestions(
    semantic_similarity: float,
    skill_overlap_pct: float,
    missing_skills: list[str],
) -> list[str]:
    suggestions: list[str] = []

    if missing_skills:
        # Cap the list shown — beyond ~6 it stops being actionable and
        # starts being overwhelming.
        shown = missing_skills[:6]
        remainder = len(missing_skills) - len(shown)
        skill_list = ", ".join(shown)
        if remainder > 0:
            skill_list += f", and {remainder} more"
        suggestions.append(
            f"This JD looks for {skill_list}, which weren't found in the resume. "
            "If you have hands-on experience with these, make sure they're stated "
            "explicitly rather than implied."
        )

    if semantic_similarity < 40:
        suggestions.append(
            "Overall content similarity to this JD is low. The resume's summary and "
            "experience bullets may be using very different language than the role "
            "actually describes — consider mirroring the JD's terminology where it "
            "genuinely applies to your experience."
        )
    elif semantic_similarity < 65:
        suggestions.append(
            "Content similarity is moderate. Tailoring the professional summary and "
            "top bullet points toward this specific role's language could improve alignment."
        )

    if skill_overlap_pct < 50 and missing_skills:
        suggestions.append(
            "Skill coverage for this specific JD is below half. This resume may be a "
            "stronger fit for a different role, or the skills section needs to be "
            "expanded to reflect all relevant tools/technologies used."
        )

    if not suggestions:
        suggestions.append("Strong alignment with this JD across both content and required skills.")

    return suggestions
