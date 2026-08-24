from fastapi import APIRouter

from app.schemas.analysis import BatchAnalysisRequest, BatchAnalysisResponse
from app.services.analysis_service import analysis_service

router = APIRouter()


@router.post("/analysis/batch", response_model=BatchAnalysisResponse)
def analyze_batch(request: BatchAnalysisRequest):
    return analysis_service.analyze_batch(items=request.items)
