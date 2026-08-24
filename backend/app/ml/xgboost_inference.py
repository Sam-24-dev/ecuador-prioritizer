"""Secure, private-bundle XGBoost inference boundary."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
from pathlib import Path
from typing import Any

import numpy as np
from scipy.sparse import hstack as sparse_hstack

from app.ml.preprocessing import preprocess_plain_text
from app.services.inference_service import InferenceInputError, InferenceResult, InferenceUnavailableError

ASSET_NAMES = (
    "mejor_modelo.joblib",
    "tfidf_vectorizer_shared.joblib",
    "xgboost_model_config.json",
)
MANIFEST_NAME = "bundle-manifest.json"
MANIFEST_SCHEMA = "ecuador-prioritizer.private-model-bundle/v1"
EXPECTED_THRESHOLD = 0.44043938914934805
HEX64 = re.compile(r"^[0-9a-f]{64}$")


def _load_joblib(path: Path):
    import joblib

    return joblib.load(path)


def _stream_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _strict_dict(value: Any, keys: set[str]) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise InferenceUnavailableError("Private model bundle manifest is invalid.")
    return value


def _validate_bundle() -> tuple[Path, dict[str, Any]]:
    bundle_raw = os.environ.get("PRIVATE_MODEL_BUNDLE_DIR", "")
    anchor = os.environ.get("PRIVATE_MODEL_MANIFEST_SHA256", "")
    if not bundle_raw or not anchor or not HEX64.fullmatch(anchor):
        raise InferenceUnavailableError("Private model bundle is not configured.")

    bundle = Path(bundle_raw)
    try:
        if not bundle.is_dir() or bundle.is_symlink():
            raise InferenceUnavailableError("Private model bundle is invalid.")
        root = bundle.resolve(strict=True)
        manifest_path = bundle / MANIFEST_NAME
        if manifest_path.is_symlink() or manifest_path.resolve(strict=True).parent != root:
            raise InferenceUnavailableError("Private model bundle is invalid.")
        manifest_digest = _stream_sha256(manifest_path)
        if not hmac.compare_digest(anchor, manifest_digest):
            raise InferenceUnavailableError("Private model bundle manifest anchor mismatch.")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        top = _strict_dict(
            manifest,
            {"schema", "bundle_id", "artifact_policy", "pipeline", "pins", "assets", "approvals"},
        )
        if top["schema"] != MANIFEST_SCHEMA or top["bundle_id"] != "xgboost-historic-v1":
            raise InferenceUnavailableError("Private model bundle manifest is invalid.")
        if top["artifact_policy"] != "private_historical_no_retraining":
            raise InferenceUnavailableError("Private model bundle manifest is invalid.")
        pipeline = _strict_dict(top["pipeline"], {"preprocessing", "feature_layout"})
        if pipeline != {"preprocessing": "historical_plain_text", "feature_layout": "feda_5000_5000_5000"}:
            raise InferenceUnavailableError("Private model bundle manifest is invalid.")
        pins = _strict_dict(top["pins"], {"model", "feature_count"})
        if pins != {"model": "xgboost", "feature_count": 15000}:
            raise InferenceUnavailableError("Private model bundle manifest is invalid.")
        approvals = _strict_dict(
            top["approvals"],
            {"owner_private_inference_authorized", "public_distribution_approved", "rights_privacy_leakage"},
        )
        if approvals != {
            "owner_private_inference_authorized": True,
            "public_distribution_approved": False,
            "rights_privacy_leakage": "documented_limitations_needs_review",
        }:
            raise InferenceUnavailableError("Private model bundle manifest is invalid.")
        assets = top["assets"]
        if not isinstance(assets, list) or len(assets) != len(ASSET_NAMES):
            raise InferenceUnavailableError("Private model bundle manifest is invalid.")
        entries: dict[str, dict[str, Any]] = {}
        for entry in assets:
            item = _strict_dict(entry, {"name", "bytes", "sha256"})
            name = item["name"]
            if name not in ASSET_NAMES or name in entries:
                raise InferenceUnavailableError("Private model bundle manifest is invalid.")
            if not isinstance(item["bytes"], int) or isinstance(item["bytes"], bool) or item["bytes"] < 0:
                raise InferenceUnavailableError("Private model bundle manifest is invalid.")
            if not isinstance(item["sha256"], str) or not HEX64.fullmatch(item["sha256"]):
                raise InferenceUnavailableError("Private model bundle manifest is invalid.")
            entries[name] = item
        if set(entries) != set(ASSET_NAMES):
            raise InferenceUnavailableError("Private model bundle manifest is invalid.")
        for name in ASSET_NAMES:
            path = bundle / name
            if path.is_symlink() or path.resolve(strict=True).parent != root:
                raise InferenceUnavailableError("Private model bundle asset path is invalid.")
            if path.stat().st_size != entries[name]["bytes"] or _stream_sha256(path) != entries[name]["sha256"]:
                raise InferenceUnavailableError("Private model bundle asset digest mismatch.")
        return root, manifest
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise InferenceUnavailableError("Private model bundle is invalid.") from error


class XGBoostInferenceService:
    """Lazy historic XGBoost inference; every load is gated by the manifest."""

    def __init__(self, artifacts_dir: Path | None = None) -> None:
        self.artifacts_dir = artifacts_dir
        self.threshold = EXPECTED_THRESHOLD
        self._model = None
        self._vectorizer = None
        self._loaded = False

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        root, _manifest = _validate_bundle()
        config_path = root / "xgboost_model_config.json"
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
            if config.get("modelo") != "xgboost" or config.get("tipo_puntaje") != "probabilidad":
                raise InferenceUnavailableError("Private model configuration is invalid.")
            configured_threshold = config.get("threshold_optimizado")
            if configured_threshold != EXPECTED_THRESHOLD:
                raise InferenceUnavailableError("Private model threshold is invalid.")
            # Validation must complete before either joblib call.
            vectorizer = _load_joblib(root / "tfidf_vectorizer_shared.joblib")
            model = _load_joblib(root / "mejor_modelo.joblib")
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as error:
            raise InferenceUnavailableError("Private model bundle could not be loaded.") from error
        self._vectorizer = vectorizer
        self._model = model
        self.threshold = configured_threshold
        self._loaded = True

    def _build_feda_vector(self, text: str):
        self._ensure_loaded()
        cleaned = preprocess_plain_text(text)
        if not cleaned.strip():
            raise InferenceInputError("Text has no analyzable content.")
        base = self._vectorizer.transform([cleaned])
        if base.shape != (1, 5000):
            raise InferenceUnavailableError("Private vectorizer has an invalid feature count.")
        return sparse_hstack([base, np.zeros((1, base.shape[1])), base], format="csr")

    def analyze(self, text: str) -> InferenceResult:
        features = self._build_feda_vector(text)
        try:
            probabilities = self._model.predict_proba(features)
            classes = list(self._model.classes_)
            true_index = classes.index(1)
            p_true = float(probabilities[0][true_index])
        except (AttributeError, IndexError, KeyError, TypeError, ValueError) as error:
            raise InferenceUnavailableError("Private model returned an invalid result.") from error
        return InferenceResult(
            preliminary_class="Verdadero" if p_true >= self.threshold else "Falso",
            p_true=p_true,
            score_false=1.0 - p_true,
        )
