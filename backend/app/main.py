import os

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from .model_service import ModelNotAvailableError, SpamModelService
from .schemas import HealthResponse, PredictionRequest, PredictionResponse


def parse_origins() -> list[str]:
    configured = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


app = FastAPI(
    title="DistilBERT Spam Detector API",
    description="Classify SMS messages using a fine-tuned DistilBERT model.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.state.model_service = SpamModelService()


def get_model_service(request: Request) -> SpamModelService:
    return request.app.state.model_service


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"message": "Spam Detector API", "docs": "/docs"}


@app.get("/api/health", response_model=HealthResponse)
def health(service: SpamModelService = Depends(get_model_service)) -> dict:
    return {"status": "ok", "model_ready": service.is_ready}


@app.post("/api/predict", response_model=PredictionResponse)
def predict(
    payload: PredictionRequest,
    service: SpamModelService = Depends(get_model_service),
) -> dict:
    try:
        return service.predict(payload.message)
    except ModelNotAvailableError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except (OSError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"The model could not make a prediction: {error}",
        ) from error

