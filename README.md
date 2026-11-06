<p align="center">
  <img src="assets/photo_2026-11-06_01-36-15.jpg" alt="Spam detection pipeline from incoming messages through tokenization and a neural network to safe or spam classification" width="100%">
</p>

<h1 align="center">Spam Detection with DistilBERT</h1>

<p align="center">
  An end-to-end transfer-learning project that fine-tunes DistilBERT on the UCI SMS Spam Collection and serves real-time predictions through a React and FastAPI application.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white" alt="Python 3.11">
  <img src="https://img.shields.io/badge/PyTorch-2.5.1-EE4C2C?logo=pytorch&logoColor=white" alt="PyTorch 2.5.1">
  <img src="https://img.shields.io/badge/FastAPI-0.115.6-009688?logo=fastapi&logoColor=white" alt="FastAPI 0.115.6">
  <img src="https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=20232A" alt="React 18.3.1">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose">
</p>

---

Incoming SMS messages are tokenized, encoded by the fine-tuned DistilBERT model, and classified as **ham** or **spam**. The repository covers the complete workflow: training, evaluation, model export, API inference, and a browser-based interface.

## What is included

- A Google Colab notebook with short explanations and runnable cells
- An 80/20 stratified train/test split
- Accuracy, precision, recall, F1-score, classification report, and confusion matrix
- A custom-message prediction function in the notebook
- A FastAPI inference API with validation, CORS, health checks, and interactive docs
- A responsive React interface for testing messages
- Dockerfiles and Docker Compose for running the full web app

## Project structure

```text
spam-detector/
├── assets/
│   └── photo_2026-11-06_01-36-15.jpg
├── notebooks/
│   └── spam_detection_distilbert_colab.ipynb
├── model/                         # Put the exported model files here
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── model_service.py
│   │   └── schemas.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Step 1: Train the model in Google Colab

1. Upload [`notebooks/spam_detection_distilbert_colab.ipynb`](notebooks/spam_detection_distilbert_colab.ipynb) to [Google Colab](https://colab.research.google.com/).
2. Select **Runtime → Change runtime type → T4 GPU**.
3. Run every cell from top to bottom.
4. The notebook downloads the [UCI SMS Spam Collection](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), loads the pretrained [DistilBERT model](https://huggingface.co/distilbert/distilbert-base-uncased), fine-tunes it, and prints the test metrics.
5. The final cell downloads `spam-distilbert-model.zip`.
6. Extract the ZIP so that its files are directly inside this project's `model/` directory.

The folder should look similar to this:

```text
model/
├── config.json
├── model.safetensors
├── tokenizer_config.json
├── tokenizer.json
├── vocab.txt
└── metrics.json
```

> The model is intentionally not committed to Git because the weight file is large. The API returns a clear `503` response until the exported model is placed in `model/`.

## Step 2: Run the web app with Docker

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), make sure it is running, then execute:

```bash
docker compose up --build
```

Open:

- React interface: <http://localhost:3000>
- FastAPI interactive docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/health>

Stop the project with `Ctrl+C`, then run `docker compose down`.

## Run without Docker

Use two terminals from the project directory.

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:MODEL_PATH = "..\model"
uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

## API example

Request:

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"message":"Congratulations! You won a free prize. Call now!"}'
```

Example response:

```json
{
  "label": "Spam",
  "is_spam": true,
  "confidence": 0.9921,
  "probabilities": {
    "ham": 0.0079,
    "spam": 0.9921
  }
}
```

The exact probabilities depend on the training run.

## How transfer learning is used

DistilBERT was pretrained on a large amount of general English text. The notebook keeps that language knowledge and fine-tunes the model weights plus a small classification head using labeled SMS messages. This needs much less task-specific data and training time than training a language model from scratch.

## Evaluation metrics

- **Accuracy:** fraction of all messages classified correctly
- **Precision:** fraction of messages predicted as spam that really are spam
- **Recall:** fraction of real spam messages the model finds
- **F1-score:** balance between spam precision and recall

For the imbalanced SMS dataset, look at precision, recall, and F1—not only accuracy.

## Notes

- This is an educational project, not a production anti-abuse system.
- Predictions are computed locally by the FastAPI service; the UI does not send messages to a third-party API.
- Very long input is truncated to 128 tokens, matching the notebook.
- Dataset credit: Almeida, T. & Hidalgo, J. (2011), *SMS Spam Collection*, UCI Machine Learning Repository, [DOI: 10.24432/C5CC84](https://doi.org/10.24432/C5CC84).

