from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints


class UrlExtractionRequest(BaseModel):
    """A URL submitted for extraction; network validation is deferred to Phase 2."""

    url: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2048)
    ]


class UrlExtractionResponse(BaseModel):
    """Editable article preview returned before any batch analysis."""

    original_url: str
    final_url: str
    domain: str
    title: str | None = None
    author: str | None = None
    published_at: date | None = None
    text: str
    original_length: int = Field(ge=0)
    truncated: bool
    warnings: list[str] = Field(default_factory=list)


class UrlExtractionError(BaseModel):
    code: str
    message: str


class UrlExtractionErrorResponse(BaseModel):
    error: UrlExtractionError


UrlExtractionErrorStatus = Literal[413, 415, 429, 502, 504]
