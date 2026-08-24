from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(title="Ecuador Prioritizer API", version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    formatted_errors = []
    for err in exc.errors():
        loc_path = ".".join(
            [str(value) for value in err.get("loc", []) if value not in ("body", "query", "path")]
        )
        formatted_errors.append(
            {
                "field": loc_path or "non_field",
                "message": err.get("msg", "Validation error"),
                "type": err.get("type", "value_error"),
            }
        )
    status_code = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)
    return JSONResponse(
        status_code=status_code,
        content={"message": "Error de validación", "errors": formatted_errors},
    )


app.include_router(api_router, prefix="/api/v1")
