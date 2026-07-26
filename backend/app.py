"""FastAPI service that serves the trained hero face-classification model."""

from __future__ import annotations

import io
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "models" / "hero_classifier.keras"
LABELS_PATH = ROOT / "models" / "labels.json"
MIN_CONFIDENCE = float(os.getenv("MIN_CONFIDENCE", "0.65"))
FACE_DETECTOR = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


class ModelStore:
    """Keeps the model and its labels loaded once for the lifetime of the API."""

    model: tf.keras.Model | None = None
    labels: list[str] = []
    image_size: int = 224
    error: str | None = None

    @classmethod
    def load(cls) -> None:
        if not MODEL_PATH.exists() or not LABELS_PATH.exists():
            cls.error = "Model files not found. Run the dataset preparation and training commands first."
            return
        try:
            metadata = json.loads(LABELS_PATH.read_text(encoding="utf-8"))
            cls.labels = metadata["labels"]
            cls.image_size = int(metadata.get("image_size", 224))
            cls.model = tf.keras.models.load_model(MODEL_PATH)
            cls.error = None
        except (OSError, ValueError, KeyError) as exc:
            cls.model = None
            cls.error = f"Could not load model: {exc}"


@asynccontextmanager
async def lifespan(_: FastAPI):
    ModelStore.load()
    yield


app = FastAPI(title="Vision Archive Recognition API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "null"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def crop_largest_face(image: Image.Image) -> np.ndarray:
    """Return a padded crop of the largest detected face, or raise a useful API error."""
    rgb = np.asarray(image.convert("RGB"))
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    faces = FACE_DETECTOR.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=6, minSize=(60, 60)
    )
    if len(faces) == 0:
        raise HTTPException(
            status_code=422,
            detail="No clear face was detected. Use a front-facing, well-lit portrait.",
        )
    x, y, width, height = max(faces, key=lambda face: face[2] * face[3])
    padding = int(max(width, height) * 0.22)
    x1, y1 = max(0, x - padding), max(0, y - padding)
    x2 = min(rgb.shape[1], x + width + padding)
    y2 = min(rgb.shape[0], y + height + padding)
    return rgb[y1:y2, x1:x2]


def prepare_for_model(face: np.ndarray) -> np.ndarray:
    resized = cv2.resize(face, (ModelStore.image_size, ModelStore.image_size))
    return np.expand_dims(resized.astype(np.float32), axis=0)


def top_predictions(probabilities: np.ndarray, count: int = 3) -> list[dict[str, Any]]:
    best_indices = np.argsort(probabilities)[::-1][:count]
    return [
        {"label": ModelStore.labels[int(index)], "confidence": float(probabilities[int(index)])}
        for index in best_indices
    ]


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "ready": ModelStore.model is not None,
        "labels": ModelStore.labels,
        "error": ModelStore.error,
    }


@app.post("/api/classify")
async def classify(image: UploadFile = File(...)) -> dict[str, Any]:
    if ModelStore.model is None:
        raise HTTPException(status_code=503, detail=ModelStore.error or "Model is not ready.")
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WEBP image.")
    try:
        portrait = Image.open(io.BytesIO(await image.read()))
        portrait.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a readable image.") from exc

    face = crop_largest_face(portrait)
    probabilities = ModelStore.model.predict(prepare_for_model(face), verbose=0)[0]
    predictions = top_predictions(probabilities)
    best = predictions[0]
    if best["confidence"] < MIN_CONFIDENCE:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "No confident match. Try a clearer image or add more training images.",
                "top_predictions": predictions,
            },
        )
    return {
        "label": best["label"],
        "confidence": best["confidence"],
        "top_predictions": predictions,
    }
