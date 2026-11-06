import os
from pathlib import Path
from threading import Lock

class ModelNotAvailableError(RuntimeError):
    """Raised when the fine-tuned model files have not been provided yet."""


class SpamModelService:
    def __init__(self, model_path: str | None = None) -> None:
        configured_path = model_path or os.getenv("MODEL_PATH", "../model")
        self.model_path = Path(configured_path).resolve()
        self.tokenizer = None
        self.model = None
        self._load_lock = Lock()

    @property
    def is_ready(self) -> bool:
        required_config = self.model_path / "config.json"
        tokenizer_files = (
            self.model_path / "tokenizer.json",
            self.model_path / "vocab.txt",
        )
        return required_config.exists() and any(path.exists() for path in tokenizer_files)

    def load(self) -> None:
        if self.model is not None and self.tokenizer is not None:
            return

        with self._load_lock:
            if self.model is not None and self.tokenizer is not None:
                return
            if not self.is_ready:
                raise ModelNotAvailableError(
                    "Fine-tuned model files were not found. Run the Colab notebook, "
                    "then extract spam-distilbert-model.zip into the model/ folder."
                )

            # Import the ML libraries only when a prediction first needs the model.
            # This keeps health checks fast and makes startup errors easier to read.
            from transformers import AutoModelForSequenceClassification, AutoTokenizer

            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_path, local_files_only=True
            )
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_path, local_files_only=True
            )
            self.model.eval()

    def predict(self, message: str) -> dict:
        import torch

        self.load()
        encoded = self.tokenizer(
            message,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=128,
        )

        with torch.inference_mode():
            logits = self.model(**encoded).logits
            probabilities = torch.softmax(logits, dim=-1)[0]

        predicted_id = int(torch.argmax(probabilities).item())
        id2label = {
            int(key): value for key, value in self.model.config.id2label.items()
        }
        predicted_name = id2label.get(predicted_id, "SPAM" if predicted_id == 1 else "HAM")
        is_spam = predicted_name.upper() == "SPAM" or predicted_id == 1
        ham_probability = float(probabilities[0].item())
        spam_probability = float(probabilities[1].item())

        return {
            "label": "Spam" if is_spam else "Not Spam (Ham)",
            "is_spam": is_spam,
            "confidence": round(float(probabilities[predicted_id].item()), 4),
            "probabilities": {
                "ham": round(ham_probability, 4),
                "spam": round(spam_probability, 4),
            },
        }

