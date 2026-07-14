"""
PDF resume parser.

Extracts both plain text (for NLP/skill extraction) and layout metadata
(for ATS parseability checks — e.g. detecting multi-column layouts that
break real-world ATS parsers).
"""
from dataclasses import dataclass, field

import pdfplumber


@dataclass
class ParsedDocument:
    raw_text: str
    page_count: int
    has_extractable_text: bool
    is_multi_column: bool
    has_embedded_images: bool
    char_count: int
    non_ascii_ratio: float = 0.0
    per_page_word_x_positions: list[list[float]] = field(default_factory=list)


def _detect_multi_column(word_x_positions: list[float], page_width: float) -> bool:
    """
    Heuristic: cluster word x-start positions into two halves of the page.
    If a significant number of words start deep into the right half AND a
    significant number start in the left half at roughly the same y-band,
    it's likely a 2-column layout. We approximate this cheaply by checking
    whether word start-x positions form two distinct clusters rather than
    one continuous left-aligned block.
    """
    if not word_x_positions or page_width == 0:
        return False

    midpoint = page_width / 2
    left = [x for x in word_x_positions if x < midpoint * 0.85]
    right = [x for x in word_x_positions if x > midpoint * 1.15]

    total = len(word_x_positions)
    if total == 0:
        return False

    # If a large chunk of words start well past the midpoint AND a large
    # chunk start well before it, that's a strong multi-column signal.
    left_ratio = len(left) / total
    right_ratio = len(right) / total
    return left_ratio > 0.25 and right_ratio > 0.25


def parse_pdf(file_path: str) -> ParsedDocument:
    """
    Parse a PDF resume. Raises ValueError on unreadable/corrupt files so
    the caller can return a clean 400 to the client instead of a 500.
    """
    try:
        text_chunks: list[str] = []
        per_page_positions: list[list[float]] = []
        has_images = False
        multi_column_flags: list[bool] = []

        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text_chunks.append(page_text)

                words = page.extract_words()
                x_positions = [w["x0"] for w in words]
                per_page_positions.append(x_positions)

                if x_positions:
                    multi_column_flags.append(_detect_multi_column(x_positions, page.width))

                if page.images:
                    has_images = True

        raw_text = "\n".join(text_chunks).strip()
        char_count = len(raw_text)
        has_extractable_text = char_count > 20  # arbitrary floor for "basically empty"

        non_ascii_count = sum(1 for c in raw_text if ord(c) > 127)
        non_ascii_ratio = (non_ascii_count / char_count) if char_count else 0.0

        is_multi_column = (
            sum(multi_column_flags) / len(multi_column_flags) > 0.4
            if multi_column_flags
            else False
        )

        return ParsedDocument(
            raw_text=raw_text,
            page_count=page_count,
            has_extractable_text=has_extractable_text,
            is_multi_column=is_multi_column,
            has_embedded_images=has_images,
            char_count=char_count,
            non_ascii_ratio=non_ascii_ratio,
            per_page_word_x_positions=per_page_positions,
        )
    except Exception as exc:
        raise ValueError(f"Could not parse PDF: {exc}") from exc
