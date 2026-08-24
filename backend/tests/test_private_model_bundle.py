import hashlib
import json
import os
from pathlib import Path

import pytest
from scipy.sparse import csr_matrix

from app.ml import xgboost_inference
from app.services.analysis_service import analysis_service
from app.services.inference_factory import create_inference_service

ASSET_NAMES = (
    "mejor_modelo.joblib",
    "tfidf_vectorizer_shared.joblib",
    "xgboost_model_config.json",
)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _manifest(bundle: Path, assets: list[dict] | None = None) -> dict:
    entries = assets or [
        {"name": name, "bytes": (bundle / name).stat().st_size, "sha256": _sha256(bundle / name)}
        for name in ASSET_NAMES
    ]
    return {
        "schema": "ecuador-prioritizer.private-model-bundle/v1",
        "bundle_id": "xgboost-historic-v1",
        "artifact_policy": "private_historical_no_retraining",
        "pipeline": {"preprocessing": "historical_plain_text", "feature_layout": "feda_5000_5000_5000"},
        "pins": {"model": "xgboost", "feature_count": 15000},
        "assets": entries,
        "approvals": {
            "owner_private_inference_authorized": True,
            "public_distribution_approved": False,
            "rights_privacy_leakage": "documented_limitations_needs_review",
        },
    }


def _write_bundle(bundle: Path, manifest: dict | None = None) -> tuple[Path, str]:
    bundle.mkdir()
    for name in ASSET_NAMES:
        (bundle / name).write_bytes(name.encode("ascii"))
    manifest_path = bundle / "bundle-manifest.json"
    manifest_path.write_text(json.dumps(manifest or _manifest(bundle), sort_keys=True), encoding="utf-8")
    return manifest_path, _sha256(manifest_path)


@pytest.fixture
def private_bundle_env(monkeypatch, tmp_path):
    bundle = tmp_path / "private-bundle"
    manifest_path, anchor = _write_bundle(bundle)
    monkeypatch.setenv("PRIVATE_MODEL_BUNDLE_DIR", str(bundle))
    monkeypatch.setenv("PRIVATE_MODEL_MANIFEST_SHA256", anchor)
    return bundle, manifest_path, anchor


@pytest.mark.parametrize(
    ("case", "mutate"),
    [
        ("manifest_missing", lambda bundle, manifest, anchor: manifest.unlink()),
        ("anchor_mismatch", lambda bundle, manifest, anchor: anchor[:-1] + ("0" if anchor[-1] != "0" else "1")),
        (
            "invalid_schema",
            lambda bundle, manifest, anchor: manifest.write_text("[]", encoding="utf-8") or _sha256(manifest),
        ),
        (
            "path_traversal",
            lambda bundle, manifest, anchor: manifest.write_text(
                json.dumps(_manifest(bundle, [
                    {"name": "../mejor_modelo.joblib", "bytes": 1, "sha256": "0" * 64},
                    *[{"name": name, "bytes": (bundle / name).stat().st_size, "sha256": _sha256(bundle / name)} for name in ASSET_NAMES[1:]],
                ])),
                encoding="utf-8",
            )
            or _sha256(manifest),
        ),
        (
            "hash_mismatch",
            lambda bundle, manifest, anchor: manifest.write_text(
                json.dumps(_manifest(bundle, [
                    {"name": ASSET_NAMES[0], "bytes": 1, "sha256": "0" * 64},
                    *[{"name": name, "bytes": (bundle / name).stat().st_size, "sha256": _sha256(bundle / name)} for name in ASSET_NAMES[1:]],
                ])),
                encoding="utf-8",
            )
            or _sha256(manifest),
        ),
    ],
)
def test_invalid_private_bundle_returns_503_before_joblib(client, monkeypatch, private_bundle_env, case, mutate):
    bundle, manifest, anchor = private_bundle_env
    replacement_anchor = mutate(bundle, manifest, anchor)
    if isinstance(replacement_anchor, str):
        monkeypatch.setenv("PRIVATE_MODEL_MANIFEST_SHA256", replacement_anchor)

    called = False

    def forbidden_load(_path):
        nonlocal called
        called = True
        raise AssertionError("joblib.load must never run for an invalid private bundle")

    monkeypatch.setattr(xgboost_inference, "_load_joblib", forbidden_load)
    monkeypatch.setattr(analysis_service, "inference_service", create_inference_service())

    response = client.post("/api/v1/analysis/batch", json={"items": [{"text": "Texto analizable suficientemente largo para esta prueba."}]})

    assert response.status_code == 503, case
    assert not called, case


def test_symlinked_private_asset_returns_503_before_joblib(client, monkeypatch, private_bundle_env):
    bundle, _manifest_path, _anchor = private_bundle_env
    monkeypatch.setattr(Path, "is_symlink", lambda path: path.name == "mejor_modelo.joblib")
    monkeypatch.setattr(xgboost_inference, "_load_joblib", lambda _path: pytest.fail("joblib.load must not run"))
    monkeypatch.setattr(analysis_service, "inference_service", create_inference_service())

    response = client.post("/api/v1/analysis/batch", json={"items": [{"text": "Texto analizable suficientemente largo para esta prueba."}]})

    assert response.status_code == 503


def test_private_bundle_runtime_pins_exact_threshold_and_feda_width(private_bundle_env, monkeypatch):
    bundle, manifest_path, _anchor = private_bundle_env
    config_path = bundle / "xgboost_model_config.json"
    config_path.write_text(
        json.dumps({"modelo": "xgboost", "tipo_puntaje": "probabilidad", "threshold_optimizado": 0.44043938914934805}),
        encoding="utf-8",
    )
    manifest_path.write_text(json.dumps(_manifest(bundle), sort_keys=True), encoding="utf-8")
    monkeypatch.setenv("PRIVATE_MODEL_MANIFEST_SHA256", _sha256(manifest_path))

    class Vectorizer:
        def transform(self, _texts):
            return csr_matrix((1, 5000))

    monkeypatch.setattr(xgboost_inference, "_load_joblib", lambda path: Vectorizer() if "vectorizer" in path.name else object())
    service = create_inference_service()

    assert service._build_feda_vector("Texto analizable para la prueba.").shape == (1, 15000)
    assert service.threshold == 0.44043938914934805


@pytest.mark.ml_integration
def test_private_historical_bundle_preserves_feda_threshold_and_http_contract(client, monkeypatch):
    bundle = os.environ.get("PRIVATE_MODEL_BUNDLE_DIR")
    anchor = os.environ.get("PRIVATE_MODEL_MANIFEST_SHA256")
    if not bundle or not anchor or not (Path(bundle) / "bundle-manifest.json").is_file():
        pytest.skip("ml_integration requires PRIVATE_MODEL_BUNDLE_DIR and PRIVATE_MODEL_MANIFEST_SHA256 for a private bundle")

    service = create_inference_service()
    service._ensure_loaded()
    assert service._build_feda_vector("Texto analizable para la prueba privada.").shape == (1, 15000)
    assert service.threshold == 0.44043938914934805
    monkeypatch.setattr(analysis_service, "inference_service", service)

    response = client.post("/api/v1/analysis/batch", json={"items": [{"client_id": "private", "text": "Texto analizable para la prueba privada de inferencia histórica."}]})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["preliminary_class"] in {"Falso", "Verdadero"}
    assert 0.0 <= body["items"][0]["p_true"] <= 1.0
