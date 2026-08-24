from app.ml import xgboost_inference
from app.services.analysis_service import analysis_service
from app.services.inference_factory import create_inference_service
from app.services.inference_service import InferenceUnavailableError


def test_unapproved_phase3_assets_return_safe_503_without_deserialization(client, monkeypatch):
    called = False

    def forbidden_load(_path):
        nonlocal called
        called = True
        raise AssertionError("joblib.load must not run before Phase 3 approval")

    monkeypatch.setattr(xgboost_inference, "_load_joblib", forbidden_load)
    monkeypatch.setattr(analysis_service, "inference_service", create_inference_service())

    response = client.post(
        "/api/v1/analysis/batch",
        json={"items": [{"text": "Texto analizable suficientemente largo para esta prueba."}]},
    )

    assert response.status_code == 503
    assert response.json()["detail"].endswith("temporalmente no disponible.")
    assert not called


def test_unapproved_service_raises_the_safe_inference_error():
    with __import__("pytest").raises(InferenceUnavailableError):
        create_inference_service().analyze("texto")
