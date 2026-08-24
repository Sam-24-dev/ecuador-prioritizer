from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="ok",
        service="ecuador-prioritizer-api",
        version=settings.VERSION
    )
