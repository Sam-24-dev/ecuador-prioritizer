from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.schemas.extraction import UrlExtractionErrorResponse, UrlExtractionRequest, UrlExtractionResponse
from app.services.article_extractor import ArticleExtractor
from app.services.http_fetcher import HttpFetcher
from app.services.url_extraction_service import DeterministicUrlExtractionService, UrlExtractionService, UrlExtractionServiceError

router = APIRouter()
EXTRACTION_ERROR_RESPONSES = {code: {"model": UrlExtractionErrorResponse} for code in (413, 415, 429, 502, 504)}


@lru_cache
def get_url_extraction_service() -> UrlExtractionService:
    """Compose one shared process-wide fetcher; no request-local limiter exists."""
    return DeterministicUrlExtractionService(
        resolver=None,
        fetcher=HttpFetcher(minimum_interval_seconds=settings.URL_EXTRACTION_MINIMUM_INTERVAL_SECONDS),
        extractor=ArticleExtractor(),
    )


@router.post("/extractions/url", response_model=UrlExtractionResponse, responses=EXTRACTION_ERROR_RESPONSES)
def extract_url(request: UrlExtractionRequest, service: Annotated[UrlExtractionService, Depends(get_url_extraction_service)]) -> UrlExtractionResponse | JSONResponse:
    try:
        return service.extract(request)
    except UrlExtractionServiceError as error:
        return JSONResponse(status_code=error.status_code, content=UrlExtractionErrorResponse(error=error.error).model_dump())
