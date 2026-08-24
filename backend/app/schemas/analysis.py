from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator


class BatchAnalysisItem(BaseModel):
    """One browser-local news item submitted for a single batch analysis."""

    client_id: Annotated[str | None, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)] = None
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=15, max_length=2000)]
    source: Annotated[str | None, StringConstraints(strip_whitespace=True, max_length=200)] = None

    @field_validator("client_id", "source", mode="before")
    @classmethod
    def clean_optional_text(cls, value: Any) -> Any:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped if stripped else None
        return value


class BatchAnalysisRequest(BaseModel):
    """All-or-nothing request: one invalid item rejects the entire batch."""

    items: Annotated[list[BatchAnalysisItem], Field(min_length=1, max_length=10)]


class BatchAnalysisResult(BaseModel):
    client_id: str | None
    preliminary_class: Literal["Falso", "Verdadero"]
    p_true: float = Field(..., ge=0.0, le=1.0)
    score_false: float = Field(..., ge=0.0, le=1.0)
    source: str | None
    text_snippet: str


class BatchAnalysisResponse(BaseModel):
    """Items are sorted: Falso first, then score_false descending, then input order."""

    items: list[BatchAnalysisResult]
    total: int = Field(..., ge=1, le=10)
