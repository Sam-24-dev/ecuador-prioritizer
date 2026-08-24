from app.main import app


def test_openapi_exposes_only_approved_stateless_routes():
    assert set(app.openapi()["paths"]) == {
        "/api/v1/health",
        "/api/v1/analysis/batch",
        "/api/v1/extractions/url",
    }


def test_legacy_persistence_and_model_routes_are_not_public(client):
    for path in (
        "/api/v1/analysis",
        "/api/v1/cases",
        "/api/v1/cases/stats",
        "/api/v1/model-info",
    ):
        assert client.get(path).status_code == 404
