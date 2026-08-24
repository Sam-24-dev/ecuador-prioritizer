"""Preprocessing for plain-text web inference.

This module reproduces the exact cleaning transformations from the historical
training pipeline helper `_limpiar_residuos_twitter` (research_reference/preprocesamiento.py),
adapted for plain-text input (without WordPress HTML <p> tag extraction).

Transformations applied:
  1. Remove URLs (http, https, www, pic.twitter.com)
  2. Remove @mentions (preserving emails like correo@dominio.com)
  3. Remove Twitter attribution lines (preserving legitimate em-dash sentences)
  4. Collapse redundant whitespace
  5. Remove spaces before punctuation (e.g. "hola , mundo" → "hola, mundo")
  6. Join cleaned lines with double newlines ("\\n\\n")

Transformations NOT applied (handled by TfidfVectorizer or omitted in training):
  - Lowercasing (TfidfVectorizer has lowercase=True)
  - Stopword removal
  - Accent removal
  - Stemming / lemmatization
  - Number removal
"""

import re

# Compiled regex patterns matching research_reference/preprocesamiento.py
URL_RE = re.compile(r"(?:https?://|www\.)\S+|pic\.twitter\.com/\S+", re.IGNORECASE)
MENTION_RE = re.compile(r"(?<!\w)@[A-Za-z0-9_]+")
TWITTER_ATTRIBUTION_RE = re.compile(
    r"^\s*[—-]\s+.*\(@[A-Za-z0-9_]+\).*(?:\d{4}|enero|febrero|marzo|abril|"
    r"mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|"
    r"jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)",
    re.IGNORECASE,
)

def preprocess_plain_text(text: str) -> str:
    """Clean plain text for inference.

    Reproduces the exact cleaning sequence of _limpiar_residuos_twitter()
    from the historical training pipeline.

    Parameters
    ----------
    text : str
        Raw plain text input from the web interface.

    Returns
    -------
    str
        Cleaned text ready for vectorizer.transform([text]).
    """
    cleaned_lines = []
    for raw_line in (text or "").splitlines():
        line = raw_line.strip()
        if not line or TWITTER_ATTRIBUTION_RE.match(line):
            continue
        line = URL_RE.sub("", line)
        line = MENTION_RE.sub("", line)
        line = re.sub(r"\s+([,.;:!?])", r"\1", " ".join(line.split()))
        if line:
            cleaned_lines.append(line)
    return "\n\n".join(cleaned_lines)
