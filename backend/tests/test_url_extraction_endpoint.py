from datetime import date
from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import extractions
from app.main import app
from app.services.http_fetcher import HttpFetchError, HttpFetcher


class CapturingTransport(httpx.AsyncBaseTransport):
    def __init__(self, handler) -> None:
        self.handler = handler
        self.requests: list[httpx.Request] = []

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.handler(request)


class FakeResolver:
    def __init__(self, answers: tuple[str, ...] = ("93.184.216.34",)) -> None:
        self.answers = answers
        self.calls: list[tuple[str, int]] = []

    def __call__(self, hostname: str, port: int) -> tuple[str, ...]:
        self.calls.append((hostname, port))
        return self.answers


class FakeExtractor:
    def __init__(self, text: str = "A deterministic article text.") -> None:
        self.text = text
        self.html_inputs: list[bytes | str] = []

    def extract_html(self, html: bytes | str) -> SimpleNamespace:
        self.html_inputs.append(html)
        return SimpleNamespace(
            title="Deterministic title",
            author="Example Author",
            published_at=date(2026, 8, 20),
            text=self.text,
            warnings=("The article may be incomplete due to a paywall.",),
        )


class FakeFetcher:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.destinations: list[object] = []

    async def fetch(self, destination: object) -> SimpleNamespace:
        self.destinations.append(destination)
        if self.error is not None:
            raise self.error
        return SimpleNamespace(
            final_url="https://example.com/final", body=b"<html>fixture</html>"
        )


@pytest.fixture
def override_service():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def test_registered_endpoint_composes_pinned_fetcher_and_local_extractor(
    override_service,
) -> None:
    service_module = __import__(
        "app.services.url_extraction_service",
        fromlist=["DeterministicUrlExtractionService"],
    )
    resolver = FakeResolver()
    transport = CapturingTransport(
        lambda request: httpx.Response(
            200,
            headers={"content-type": "text/html"},
            content=b"<html>fixture</html>",
            request=request,
        )
    )
    extractor = FakeExtractor()
    service = service_module.DeterministicUrlExtractionService(
        resolver=resolver,
        fetcher=HttpFetcher(
            resolver=resolver, transport=transport, minimum_interval_seconds=0
        ),
        extractor=extractor,
    )
    app.dependency_overrides[extractions.get_url_extraction_service] = lambda: service

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/extractions/url", json={"url": "https://example.com/news"}
        )

    assert response.status_code == 200
    assert response.json() == {
        "original_url": "https://example.com/news",
        "final_url": "https://example.com/news",
        "domain": "example.com",
        "title": "Deterministic title",
        "author": "Example Author",
        "published_at": "2026-08-20",
        "text": "A deterministic article text.",
        "original_length": 29,
        "truncated": False,
        "warnings": [
            "The article may be incomplete due to a paywall.",
            "The extracted article text is shorter than 200 characters.",
        ],
    }
    assert resolver.calls == [("example.com", 443)]
    assert extractor.html_inputs == [b"<html>fixture</html>"]


@pytest.mark.parametrize(
    ("fetch_error", "status_code", "code", "message"),
    [
        (
            HttpFetchError("The response is too large."),
            413,
            "response_too_large",
            "The fetched response is too large.",
        ),
        (
            HttpFetchError("The response content type is not allowed."),
            415,
            "unsupported_media_type",
            "The fetched response is not supported.",
        ),
        (
            HttpFetchError("The request timed out."),
            504,
            "upstream_timeout",
            "The upstream request timed out.",
        ),
        (
            HttpFetchError("The remote server returned an error."),
            502,
            "upstream_unavailable",
            "The upstream service is unavailable.",
        ),
    ],
)
def test_endpoint_maps_fetcher_failures_to_sanitized_contract_errors(
    override_service,
    fetch_error: HttpFetchError,
    status_code: int,
    code: str,
    message: str,
) -> None:
    service_module = __import__(
        "app.services.url_extraction_service",
        fromlist=["DeterministicUrlExtractionService"],
    )
    service = service_module.DeterministicUrlExtractionService(
        resolver=FakeResolver(),
        fetcher=FakeFetcher(error=fetch_error),
        extractor=FakeExtractor(),
    )
    app.dependency_overrides[extractions.get_url_extraction_service] = lambda: service

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/extractions/url", json={"url": "https://example.com/news"}
        )

    assert response.status_code == status_code
    assert response.json() == {"error": {"code": code, "message": message}}


def test_endpoint_maps_rejected_destinations_and_short_text_to_sanitized_422s(
    override_service,
) -> None:
    service_module = __import__(
        "app.services.url_extraction_service",
        fromlist=["DeterministicUrlExtractionService"],
    )
    blocked_service = service_module.DeterministicUrlExtractionService(
        resolver=FakeResolver(("127.0.0.1",)),
        fetcher=FakeFetcher(),
        extractor=FakeExtractor(),
    )
    app.dependency_overrides[extractions.get_url_extraction_service] = lambda: blocked_service

    with TestClient(app) as client:
        blocked = client.post(
            "/api/v1/extractions/url", json={"url": "https://example.com/news"}
        )

    assert blocked.status_code == 422
    assert blocked.json() == {
        "error": {"code": "invalid_url", "message": "The URL is not allowed."}
    }

    short_service = service_module.DeterministicUrlExtractionService(
        resolver=FakeResolver(),
        fetcher=FakeFetcher(),
        extractor=FakeExtractor(text="too short"),
    )
    app.dependency_overrides[extractions.get_url_extraction_service] = lambda: short_service

    with TestClient(app) as client:
        short = client.post(
            "/api/v1/extractions/url", json={"url": "https://example.com/news"}
        )

    assert short.status_code == 422
    assert short.json() == {
        "error": {
            "code": "extracted_text_too_short",
            "message": "The extracted article text is too short.",
        }
    }


def test_endpoint_preserves_upstream_429_as_a_sanitized_rate_limit(
    override_service,
) -> None:
    service_module = __import__(
        "app.services.url_extraction_service",
        fromlist=["DeterministicUrlExtractionService"],
    )
    resolver = FakeResolver()
    transport = CapturingTransport(
        lambda request: httpx.Response(
            429,
            headers={"content-type": "text/html"},
            content=b"upstream quota detail must not be exposed",
            request=request,
        )
    )
    service = service_module.DeterministicUrlExtractionService(
        resolver=resolver,
        fetcher=HttpFetcher(
            resolver=resolver, transport=transport, minimum_interval_seconds=0
        ),
        extractor=FakeExtractor(),
    )
    app.dependency_overrides[extractions.get_url_extraction_service] = lambda: service

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/extractions/url", json={"url": "https://example.com/news"}
        )

    assert response.status_code == 429
    assert response.json() == {
        "error": {
            "code": "rate_limited",
            "message": "URL extraction is rate limited.",
        }
    }
