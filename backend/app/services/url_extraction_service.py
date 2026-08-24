from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from typing import Any, Protocol
from urllib.parse import urlsplit

from app.schemas.extraction import (
    UrlExtractionError,
    UrlExtractionRequest,
    UrlExtractionResponse,
)
from app.services.extraction_text import (
    ExtractionTextTooShortError,
    prepare_extraction_text,
)
from app.services.url_security import Resolver, ValidatedUrl, UrlSecurityError, validate_url


class _DocumentFetcher(Protocol):
    def fetch(self, destination: ValidatedUrl) -> Awaitable[Any]:
        """Return a validated downloaded document."""


class _HtmlExtractor(Protocol):
    def extract_html(self, html: bytes | str) -> Any:
        """Extract local HTML only; network access is outside this boundary."""


class UrlExtractionService(Protocol):
    """Build an editable URL extraction preview without invoking inference."""

    def extract(self, request: UrlExtractionRequest) -> UrlExtractionResponse:
        """Return one sanitized, deterministic extraction preview."""


class DeterministicUrlExtractionService:
    """Compose the approved URL validation, fetch, extraction, and text-limit stages."""

    def __init__(
        self,
        *,
        resolver: Resolver | None,
        fetcher: _DocumentFetcher,
        extractor: _HtmlExtractor,
        validator: Callable[..., ValidatedUrl] = validate_url,
    ) -> None:
        self._resolver = resolver
        self._fetcher = fetcher
        self._extractor = extractor
        self._validator = validator

    def extract(self, request: UrlExtractionRequest) -> UrlExtractionResponse:
        """Assemble a preview with no inference, persistence, or metadata-to-model path."""
        try:
            destination = self._validator(request.url, resolver=self._resolver)
            document: Any = asyncio.run(_fetch_document(self._fetcher, destination))
            article = self._extractor.extract_html(document.body)
            prepared = prepare_extraction_text(article.text)
            domain = _domain_from_final_url(document.final_url)
        except UrlExtractionServiceError:
            raise
        except Exception as error:
            raise _map_pipeline_error(error) from error

        return UrlExtractionResponse(
            original_url=request.url,
            final_url=document.final_url,
            domain=domain,
            title=article.title,
            author=article.author,
            published_at=article.published_at,
            text=prepared.text,
            original_length=prepared.original_length,
            truncated=prepared.truncated,
            warnings=_merge_warnings(article.warnings, prepared.warnings),
        )


class UnconfiguredUrlExtractionService:
    """Default dependency that performs no network activity."""

    def extract(self, request: UrlExtractionRequest) -> UrlExtractionResponse:
        raise UrlExtractionServiceError(
            status_code=502,
            code="service_unavailable",
            message="URL extraction is not configured.",
        )


class UrlExtractionServiceError(Exception):
    """A sanitized, contract-defined URL extraction failure."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.error = UrlExtractionError(code=code, message=message)
        super().__init__(message)


async def _fetch_document(fetcher: _DocumentFetcher, destination: ValidatedUrl) -> Any:
    return await fetcher.fetch(destination)


def _domain_from_final_url(final_url: str) -> str:
    hostname = urlsplit(final_url).hostname
    if hostname is None:
        raise ValueError("The fetched URL is invalid.")
    return hostname


def _merge_warnings(*warning_sets: tuple[str, ...]) -> list[str]:
    return list(dict.fromkeys(warning for warnings in warning_sets for warning in warnings))


def _map_pipeline_error(error: Exception) -> UrlExtractionServiceError:
    module = type(error).__module__
    if isinstance(error, UrlSecurityError):
        return UrlExtractionServiceError(
            status_code=422,
            code="invalid_url",
            message="The URL is not allowed.",
        )
    if isinstance(error, ExtractionTextTooShortError):
        return UrlExtractionServiceError(
            status_code=422,
            code="extracted_text_too_short",
            message="The extracted article text is too short.",
        )
    if module == "app.services.http_fetcher":
        return _map_fetcher_error(str(error))
    return UrlExtractionServiceError(
        status_code=502,
        code="upstream_unavailable",
        message="The upstream service is unavailable.",
    )


def _map_fetcher_error(message: str) -> UrlExtractionServiceError:
    mapping = {
        "The response is too large.": (413, "response_too_large", "The fetched response is too large."),
        "The response content type is not allowed.": (
            415,
            "unsupported_media_type",
            "The fetched response is not supported.",
        ),
        "The request timed out.": (504, "upstream_timeout", "The upstream request timed out."),
        "The remote server rate limited the request.": (
            429,
            "rate_limited",
            "URL extraction is rate limited.",
        ),
    }
    status_code, code, sanitized_message = mapping.get(
        message,
        (502, "upstream_unavailable", "The upstream service is unavailable."),
    )
    return UrlExtractionServiceError(
        status_code=status_code,
        code=code,
        message=sanitized_message,
    )
