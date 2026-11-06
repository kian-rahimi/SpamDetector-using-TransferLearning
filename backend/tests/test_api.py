from fastapi.testclient import TestClient

from app.main import app


class FakeModelService:
    is_ready = True

    def predict(self, message: str) -> dict:
        is_spam = "prize" in message.lower()
        return {
            "label": "Spam" if is_spam else "Not Spam (Ham)",
            "is_spam": is_spam,
            "confidence": 0.98,
            "probabilities": {
                "ham": 0.02 if is_spam else 0.98,
                "spam": 0.98 if is_spam else 0.02,
            },
        }


client = TestClient(app)
app.state.model_service = FakeModelService()


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "model_ready": True}


def test_predict_spam() -> None:
    response = client.post("/api/predict", json={"message": "Claim your prize now"})
    assert response.status_code == 200
    assert response.json()["is_spam"] is True


def test_rejects_blank_message() -> None:
    response = client.post("/api/predict", json={"message": "   "})
    assert response.status_code == 422

