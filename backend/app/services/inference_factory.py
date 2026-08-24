from app.ml.xgboost_inference import XGBoostInferenceService
from app.services.inference_service import InferenceService


def create_inference_service() -> InferenceService:
    """Compose only the approved XGBoost runtime; no mock or plugin fallback exists."""
    return XGBoostInferenceService()
