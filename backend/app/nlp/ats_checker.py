"""
ATS Parseability Checker.

Deliberately rule-based, not ML-based: this makes the score fully
explainable ("here are the exact 8 things we checked and why you lost
points"), which is both more honest and a stronger demo/viva story than an
opaque model output.

Each check returns pass/fail + a human-readable message + a weight. Overall
score = sum(weights of passed checks) / sum(all weights) * 100.
"""
from dataclasses import dataclass

from app.nlp.skill_extractor import extract_contact_info, extract_education
from app.parsers.pdf_parser import ParsedDocument

SECTION_HEADERS = [
    "experience", "work experience", "education", "skills", "projects",
    "summary", "objective", "certifications", "achievements",
]


@dataclass
class ATSCheckResult:
    name: str
    passed: bool
    message: str
    weight: int


def _check_extractable_text(doc: ParsedDocument) -> ATSCheckResult:
    passed = doc.has_extractable_text
    return ATSCheckResult(
        name="Text Extractability",
        passed=passed,
        message=(
            "Resume text extracts cleanly."
            if passed
            else "Little to no text could be extracted — this resume may be a "
            "scanned image rather than real text. Most ATS will read this as blank."
        ),
        weight=25,
    )


def _check_section_headers(text: str) -> ATSCheckResult:
    lower = text.lower()
    found = [h for h in SECTION_HEADERS if h in lower]
    passed = len(found) >= 3
    return ATSCheckResult(
        name="Standard Section Headers",
        passed=passed,
        message=(
            f"Found standard section headers ({', '.join(found[:5])})."
            if passed
            else "Fewer than 3 standard section headers detected (e.g. Experience, "
            "Education, Skills). ATS relies on these to bucket your content correctly — "
            "use conventional header names."
        ),
        weight=20,
    )


def _check_layout(doc: ParsedDocument) -> ATSCheckResult:
    passed = not doc.is_multi_column
    return ATSCheckResult(
        name="Single-Column Layout",
        passed=passed,
        message=(
            "No multi-column layout detected."
            if passed
            else "Multi-column or table-based layout detected. Many ATS parsers read "
            "left-to-right across the full width, which can scramble multi-column "
            "content into the wrong order or skip it entirely."
        ),
        weight=20,
    )


def _check_images(doc: ParsedDocument) -> ATSCheckResult:
    passed = not doc.has_embedded_images
    return ATSCheckResult(
        name="No Icon/Image-Based Info",
        passed=passed,
        message=(
            "No embedded images detected."
            if passed
            else "Embedded images/icons detected. If contact info or section labels "
            "are conveyed via icons (e.g. a phone icon instead of the word 'Phone'), "
            "ATS cannot read them — use plain text instead."
        ),
        weight=10,
    )


def _check_contact_info(text: str) -> ATSCheckResult:
    contact = extract_contact_info(text)
    passed = bool(contact["email"]) and bool(contact["phone"])
    missing = [k for k, v in contact.items() if not v]
    return ATSCheckResult(
        name="Extractable Contact Info",
        passed=passed,
        message=(
            "Email and phone number both extracted successfully."
            if passed
            else f"Could not reliably extract: {', '.join(missing)}. Make sure this "
            "is plain text near the top of the document, not inside an image or table."
        ),
        weight=15,
    )


def _check_special_characters(doc: ParsedDocument) -> ATSCheckResult:
    passed = doc.non_ascii_ratio < 0.02
    return ATSCheckResult(
        name="Minimal Special Characters",
        passed=passed,
        message=(
            "Low use of unusual symbols/unicode characters."
            if passed
            else "High proportion of non-standard characters detected (unusual bullets, "
            "symbols, or icons). These sometimes render as garbled text or '?' in ATS "
            "systems — stick to standard bullets ('-', '•') and plain punctuation."
        ),
        weight=5,
    )


def _check_length(doc: ParsedDocument) -> ATSCheckResult:
    passed = doc.page_count <= 2
    return ATSCheckResult(
        name="Reasonable Length",
        passed=passed,
        message=(
            f"Resume is {doc.page_count} page(s) — within the recommended range."
            if passed
            else f"Resume is {doc.page_count} pages. Many ATS/recruiter workflows "
            "de-prioritize or truncate resumes beyond 2 pages for early-career roles."
        ),
        weight=5,
    )


def run_ats_checks(doc: ParsedDocument) -> tuple[float, list[ATSCheckResult], list[str]]:
    """
    Runs all checks and returns (overall_score, checks, suggestions).
    suggestions is just the messages of every failed check, in priority order
    (highest weight first) so the user knows what to fix first.
    """
    checks = [
        _check_extractable_text(doc),
        _check_section_headers(doc.raw_text),
        _check_layout(doc),
        _check_contact_info(doc.raw_text),
        _check_images(doc),
        _check_special_characters(doc),
        _check_length(doc),
    ]

    total_weight = sum(c.weight for c in checks)
    earned_weight = sum(c.weight for c in checks if c.passed)
    overall_score = round((earned_weight / total_weight) * 100, 1) if total_weight else 0.0

    failed_sorted = sorted((c for c in checks if not c.passed), key=lambda c: -c.weight)
    suggestions = [c.message for c in failed_sorted]

    return overall_score, checks, suggestions
