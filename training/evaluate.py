"""Evaluate the trained classifier on held-out portraits and show class confusions."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate a trained hero face classifier.")
    parser.add_argument("--data", type=Path, default=Path("dataset/faces/val"))
    parser.add_argument("--model", type=Path, default=Path("models/hero_classifier.keras"))
    parser.add_argument("--labels", type=Path, default=Path("models/labels.json"))
    parser.add_argument("--batch-size", type=int, default=24)
    args = parser.parse_args()

    if not args.data.is_dir() or not args.model.exists() or not args.labels.exists():
        raise SystemExit("Validation data, model, or labels file is missing. Train the model first.")
    metadata = json.loads(args.labels.read_text(encoding="utf-8"))
    labels = metadata["labels"]
    image_size = int(metadata.get("image_size", 224))
    dataset = tf.keras.utils.image_dataset_from_directory(
        args.data, class_names=labels, label_mode="int", shuffle=False,
        image_size=(image_size, image_size), batch_size=args.batch_size,
    )
    model = tf.keras.models.load_model(args.model)
    actual, predicted = [], []
    for images, class_ids in dataset:
        probabilities = model.predict(images, verbose=0)
        actual.extend(class_ids.numpy().tolist())
        predicted.extend(np.argmax(probabilities, axis=1).tolist())

    matrix = np.zeros((len(labels), len(labels)), dtype=int)
    for truth, guess in zip(actual, predicted):
        matrix[truth, guess] += 1
    accuracy = float(np.mean(np.asarray(actual) == np.asarray(predicted)))
    print(f"Held-out accuracy: {accuracy:.1%}")
    print("Rows = actual, columns = predicted")
    print(" " * 18 + " ".join(f"{label[:10]:>10}" for label in labels))
    for index, label in enumerate(labels):
        print(f"{label[:16]:>16}  " + " ".join(f"{value:10d}" for value in matrix[index]))

    report_path = args.model.parent / "evaluation.json"
    report_path.write_text(
        json.dumps({"accuracy": accuracy, "labels": labels, "confusion_matrix": matrix.tolist()}, indent=2),
        encoding="utf-8",
    )
    print(f"Saved confusion matrix to {report_path}")


if __name__ == "__main__":
    main()
