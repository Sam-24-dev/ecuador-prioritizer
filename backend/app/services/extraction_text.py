import re
from dataclasses import dataclass

MIN_EXTRACTION_TEXT_LENGTH = 15
MAX_EXTRACTION_TEXT_LENGTH = 2_000
SHORT_TEXT_WARNING = "The extracted article text is shorter than 200 characters."

_PERIOD = re.compile(r"(?<!\.)\.(?!\.)")


class ExtractionTextTooShortError(ValueError):
    """Raised when extracted content cannot form a valid editable preview."""


@dataclass(frozen=True)
class PreparedExtractionText:
    """Text prepared for the existing editable extraction response contract."""

    text: str
    original_length: int
    truncated: bool
    warnings: tuple[str, ...]


def prepare_extraction_text(text: str) -> PreparedExtractionText:
    """Apply the URL-extraction preview text limits without invoking the model."""
    original_length = len(text)
    if original_length < MIN_EXTRACTION_TEXT_LENGTH:
        raise ExtractionTextTooShortError(
            "Extracted article text must contain at least 15 characters."
        )

    if original_length <= MAX_EXTRACTION_TEXT_LENGTH:
        return PreparedExtractionText(
            text=text,
            original_length=original_length,
            truncated=False,
            warnings=_short_text_warning(original_length),
        )

    return PreparedExtractionText(
        text=_truncate_at_last_period(text),
        original_length=original_length,
        truncated=True,
        warnings=(),
    )


def _short_text_warning(length: int) -> tuple[str, ...]:
    if length < 200:
        return (SHORT_TEXT_WARNING,)
    return ()


def _truncate_at_last_period(text: str) -> str:
    candidate = text[:MAX_EXTRACTION_TEXT_LENGTH]
    periods = list(_PERIOD.finditer(candidate))
    if periods:
        period_truncation = candidate[: periods[-1].end()]
        if len(period_truncation) >= MIN_EXTRACTION_TEXT_LENGTH:
            return period_truncation
    return candidate
