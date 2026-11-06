from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5_000,
        examples=["Congratulations! You won a free prize. Call now!"],
    )

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be blank")
        return value


class PredictionResponse(BaseModel):
    label: str
    is_spam: bool
    confidence: float
    probabilities: dict[str, float]


class HealthResponse(BaseModel):
    status: str
    model_ready: bool

