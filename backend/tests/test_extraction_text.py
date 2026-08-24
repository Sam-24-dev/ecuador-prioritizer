import pytest
from app.services.extraction_text import (
    ExtractionTextTooShortError,
    prepare_extraction_text,
)


@pytest.mark.parametrize("length", [0, 14])
def test_rejects_extracted_text_shorter_than_fifteen_characters(length: int) -> None:
    with pytest.raises(ExtractionTextTooShortError):
        prepare_extraction_text("x" * length)


def test_accepts_exactly_fifteen_characters_with_a_short_text_warning() -> None:
    result = prepare_extraction_text("x" * 15)

    assert result.text == "x" * 15
    assert result.original_length == 15
    assert result.truncated is False
    assert result.warnings == ("The extracted article text is shorter than 200 characters.",)


def test_marks_text_from_fifteen_to_one_hundred_ninety_nine_characters_as_short() -> None:
    result = prepare_extraction_text("x" * 199)

    assert result.truncated is False
    assert result.warnings == ("The extracted article text is shorter than 200 characters.",)


def test_keeps_two_hundred_to_two_thousand_characters_unchanged() -> None:
    text = "á" * 2_000

    result = prepare_extraction_text(text)

    assert result.text == text
    assert result.original_length == 2_000
    assert result.truncated is False
    assert result.warnings == ()


def test_truncates_at_the_last_period_within_the_limit() -> None:
    text = f"{'A' * 1_980}. {'B' * 50}"

    result = prepare_extraction_text(text)

    assert result.text == f"{'A' * 1_980}."
    assert result.original_length == len(text)
    assert result.truncated is True
    assert result.warnings == ()


@pytest.mark.parametrize("non_period_marker", ["!", "?", "..."])
def test_ignores_non_period_markers_when_truncating(
    non_period_marker: str,
) -> None:
    text = f"{'A' * 1_980}{non_period_marker} {'B' * 50}"

    result = prepare_extraction_text(text)

    assert result.text == text[:2_000]
    assert len(result.text) == 2_000
    assert result.truncated is True


def test_uses_a_period_before_the_limit_even_without_following_whitespace() -> None:
    text = f"{'A' * 1_980}.{'B' * 50}"

    result = prepare_extraction_text(text)

    assert result.text == f"{'A' * 1_980}."
    assert result.truncated is True


def test_uses_a_compliant_fallback_when_only_sentence_boundary_is_too_short() -> None:
    text = "A. " + ("B" * 2_500)

    result = prepare_extraction_text(text)

    assert result.text == text[:2_000]
    assert 15 <= len(result.text) <= 2_000
    assert result.original_length == len(text)
    assert result.truncated is True


def test_uses_the_hard_limit_when_no_sentence_boundary_is_available() -> None:
    text = "🙂" * 2_001

    result = prepare_extraction_text(text)

    assert result.text == "🙂" * 2_000
    assert result.original_length == 2_001
    assert result.truncated is True


def test_preserves_newlines_when_the_text_is_not_truncated() -> None:
    text = "Line one\nLine two\n" + ("x" * 180)

    result = prepare_extraction_text(text)

    assert result.text == text
    assert result.original_length == len(text)
    assert result.truncated is False
