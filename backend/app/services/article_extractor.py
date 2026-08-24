"""Local article extraction for HTML already downloaded by the controlled fetcher."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date

import trafilatura
from trafilatura.utils import decode_file

_EMPTY_TEXT_WARNING = "No article text could be extracted."
_PAYWALL_WARNING = "The article may be incomplete due to a paywall."
_PAYWALL_MARKERS = ("paywall", "contenido para suscriptores", "subscribe to continue")


@dataclass(frozen=True)
class ExtractedArticle:
    """Clean article content and optional metadata derived from downloaded HTML."""

    title: str | None
    author: str | None
    published_at: date | None
    text: str
    warnings: tuple[str, ...]


class ArticleExtractor:
    """Extract one article from supplied HTML without performing any network activity."""

    def extract_html(self, html: bytes | str) -> ExtractedArticle:
        """Return a normalized preview from HTML bytes or text already fetched upstream."""
        decoded_html = decode_file(html)
        metadata = trafilatura.extract_metadata(decoded_html)
        text = _normalize_text(
            trafilatura.extract(
                decoded_html,
                output_format="txt",
                include_comments=False,
                include_tables=True,
                favor_precision=True,
            )
        )
        warnings = _quality_warnings(text, decoded_html)
        return ExtractedArticle(
            title=_clean_metadata(metadata.title),
            author=_clean_metadata(metadata.author),
            published_at=_parse_date(metadata.date),
            text=text,
            warnings=warnings,
        )


def _normalize_text(text: str | None) -> str:
    if not text:
        return ""
    lines = (re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines())
    return "\n".join(line for line in lines if line)


def _clean_metadata(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.split())
    return normalized or None


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def _quality_warnings(text: str, html: str) -> tuple[str, ...]:
    if not text:
        return (_EMPTY_TEXT_WARNING,)
    lowered_html = html.casefold()
    if any(marker in lowered_html for marker in _PAYWALL_MARKERS):
        return (_PAYWALL_WARNING,)
    return ()
