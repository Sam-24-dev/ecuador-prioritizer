from fastapi import HTTPException, status

from app.schemas.analysis import BatchAnalysisItem, BatchAnalysisResponse, BatchAnalysisResult
from app.services.inference_factory import create_inference_service
from app.services.inference_service import InferenceError, InferenceInputError, InferenceService


class BatchAnalysisService:
    """Persistence-free batch orchestration for the public API."""

    def __init__(self, inference_service: InferenceService) -> None:
        self.inference_service = inference_service

    def analyze_batch(self, items: list[BatchAnalysisItem]) -> BatchAnalysisResponse:
        results: list[tuple[int, BatchAnalysisResult]] = []
        try:
            for index, item in enumerate(items):
                result = self.inference_service.analyze(item.text)
                snippet = item.text[:117] + "..." if len(item.text) > 120 else item.text
                results.append(
                    (
                        index,
                        BatchAnalysisResult(
                            client_id=item.client_id,
                            preliminary_class=result.preliminary_class,
                            p_true=result.p_true,
                            score_false=result.score_false,
                            source=item.source,
                            text_snippet=snippet,
                        ),
                    )
                )
        except InferenceInputError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Uno o más textos no contienen contenido analizable después del preprocesamiento.",
            ) from error
        except InferenceError as error:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio de análisis temporalmente no disponible.",
            ) from error

        ordered = sorted(
            results,
            key=lambda entry: (
                0 if entry[1].preliminary_class == "Falso" else 1,
                -entry[1].score_false,
                entry[0],
            ),
        )
        return BatchAnalysisResponse(items=[result for _, result in ordered], total=len(ordered))


analysis_service = BatchAnalysisService(inference_service=create_inference_service())
