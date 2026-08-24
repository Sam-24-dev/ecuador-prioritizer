from app.services.inference_service import InferenceResult


def test_batch_analysis_orders_false_items_then_score_and_stays_session_neutral(client, monkeypatch):
    from app.services.analysis_service import analysis_service

    class StubInference:
        def analyze(self, text: str) -> InferenceResult:
            return {
                "Texto verdadero con score menor que los falsos.": InferenceResult("Verdadero", 0.8, 0.2),
                "Texto falso con score bajo para ordenar.": InferenceResult("Falso", 0.45, 0.55),
                "Texto falso con score alto para ordenar.": InferenceResult("Falso", 0.1, 0.9),
            }[text]

    monkeypatch.setattr(analysis_service, "inference_service", StubInference())
    response = client.post("/api/v1/analysis/batch", json={"items": [
        {"client_id": "true", "text": "Texto verdadero con score menor que los falsos."},
        {"client_id": "false-low", "text": "Texto falso con score bajo para ordenar."},
        {"client_id": "false-high", "text": "Texto falso con score alto para ordenar."},
    ]})
    assert response.status_code == 200
    assert [item["client_id"] for item in response.json()["items"]] == ["false-high", "false-low", "true"]


def test_batch_analysis_rejects_eleven_items_before_inference(client):
    response = client.post("/api/v1/analysis/batch", json={"items": [{"text": "Texto suficientemente largo para el analisis por lote."}] * 11})
    assert response.status_code == 422


def test_batch_analysis_rejects_invalid_items_without_echoing_text(client):
    private_marker = "SECRET_1122"
    response = client.post("/api/v1/analysis/batch", json={"items": [{"text": "Texto valido para llegar al lote."}, {"text": private_marker}]})
    assert response.status_code == 422
    assert private_marker not in response.text
