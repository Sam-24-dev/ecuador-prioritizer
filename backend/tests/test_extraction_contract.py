from datetime import date
from importlib import import_module

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient


def test_url_extraction_response_preserves_the_preview_contract() -> None:
    extraction = import_module("app.schemas.extraction")
    response = extraction.UrlExtractionResponse(
        original_url="https://example.com/noticia",
        final_url="https://www.example.com/noticia-final",
        domain="www.example.com",
        title="Sample news title",
        author="Example Author",
        published_at=date(2026, 8, 20),
        text="Extracted article text",
        original_length=22,
        truncated=False,
        warnings=["metadata_incomplete"],
    )

    assert response.model_dump(mode="json") == {
        "original_url": "https://example.com/noticia",
        "final_url": "https://www.example.com/noticia-final",
        "domain": "www.example.com",
        "title": "Sample news title",
        "author": "Example Author",
        "published_at": "2026-08-20",
        "text": "Extracted article text",
        "original_length": 22,
        "truncated": False,
        "warnings": ["metadata_incomplete"],
    }


class FakeUrlExtractionService:
    def __init__(
        self, response: object | None = None, error: Exception | None = None
    ) -> None:
        self.response = response
        self.error = error
        self.requests: list[object] = []

    def extract(self, request: object) -> object:
        self.requests.append(request)
        if self.error is not None:
            raise self.error
        assert self.response is not None
        return self.response


def test_url_extraction_endpoint_uses_an_injected_fake_service() -> None:
    endpoint = import_module("app.api.v1.endpoints.extractions")
    extraction = import_module("app.schemas.extraction")
    response_model = extraction.UrlExtractionResponse(
        original_url="https://example.com/noticia",
        final_url="https://www.example.com/noticia-final",
        domain="www.example.com",
        title="Sample news title",
        author="Example Author",
        published_at=date(2026, 8, 20),
        text="Extracted article text",
        original_length=22,
        truncated=False,
        warnings=["metadata_incomplete"],
    )
    service = FakeUrlExtractionService(response=response_model)
    app = FastAPI()
    app.include_router(endpoint.router, prefix="/api/v1")
    app.dependency_overrides[endpoint.get_url_extraction_service] = lambda: service

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/extractions/url", json={"url": "https://example.com/noticia"}
        )

    assert response.status_code == 200
    assert response.json() == response_model.model_dump(mode="json")
    assert [request.url for request in service.requests] == [
        "https://example.com/noticia"
    ]


def test_url_extraction_endpoint_rejects_blank_urls_with_422() -> None:
    endpoint = import_module("app.api.v1.endpoints.extractions")
    app = FastAPI()
    app.include_router(endpoint.router, prefix="/api/v1")

    with TestClient(app) as client:
        response = client.post("/api/v1/extractions/url", json={"url": "   "})

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("status_code", "code"),
    [
        (413, "response_too_large"),
        (415, "unsupported_media_type"),
        (429, "rate_limited"),
        (502, "upstream_unavailable"),
        (504, "upstream_timeout"),
    ],
)
def test_url_extraction_endpoint_maps_defined_service_errors(
    status_code: int, code: str
) -> None:
    endpoint = import_module("app.api.v1.endpoints.extractions")
    service_module = import_module("app.services.url_extraction_service")
    service = FakeUrlExtractionService(
        error=service_module.UrlExtractionServiceError(
            status_code=status_code, code=code, message="safe error"
        )
    )
    app = FastAPI()
    app.include_router(endpoint.router, prefix="/api/v1")
    app.dependency_overrides[endpoint.get_url_extraction_service] = lambda: service

    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post(
            "/api/v1/extractions/url", json={"url": "https://example.com/noticia"}
        )

    assert response.status_code == status_code
    assert response.json() == {"error": {"code": code, "message": "safe error"}}


def test_url_extraction_openapi_declares_every_contract_error() -> None:
    endpoint = import_module("app.api.v1.endpoints.extractions")
    app = FastAPI()
    app.include_router(endpoint.router, prefix="/api/v1")

    responses = app.openapi()["paths"]["/api/v1/extractions/url"]["post"]["responses"]

    assert {"200", "422", "413", "415", "429", "502", "504"}.issubset(responses)
