"""Detect, crop, and split labelled hero portraits for model training."""

from __future__ import annotations

import argparse
import random
import shutil
from pathlib import Path

import cv2

VALID_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
DETECTOR = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def crop_face(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = DETECTOR.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(60, 60))
    if len(faces) == 0:
        return None
    x, y, width, height = max(faces, key=lambda face: face[2] * face[3])
    padding = int(max(width, height) * 0.22)
    x1, y1 = max(0, x - padding), max(0, y - padding)
    x2 = min(image.shape[1], x + width + padding)
    y2 = min(image.shape[0], y + height + padding)
    return image[y1:y2, x1:x2]


def main() -> None:
    parser = argparse.ArgumentParser(description="Create cropped train/validation face folders.")
    parser.add_argument("--source", type=Path, default=Path("dataset/raw"))
    parser.add_argument("--output", type=Path, default=Path("dataset/faces"))
    parser.add_argument("--validation-split", type=float, default=0.2)
    parser.add_argument("--replace", action="store_true", help="Replace the generated output folder.")
    args = parser.parse_args()

    if not args.source.is_dir():
        raise SystemExit(f"Source folder not found: {args.source}")
    if args.output.exists() and any(args.output.iterdir()):
        if not args.replace:
            raise SystemExit(f"{args.output} already contains files. Use --replace to regenerate it.")
        shutil.rmtree(args.output)

    class_dirs = [directory for directory in sorted(args.source.iterdir()) if directory.is_dir()]
    if len(class_dirs) < 2:
        raise SystemExit("Add portraits for at least two hero label folders before preparing the dataset.")

    random_generator = random.Random(42)
    accepted_total = 0
    for class_dir in class_dirs:
        files = [path for path in class_dir.rglob("*") if path.suffix.lower() in VALID_SUFFIXES]
        random_generator.shuffle(files)
        accepted = []
        for path in files:
            image = cv2.imread(str(path))
            if image is None:
                continue
            face = crop_face(image)
            if face is not None:
                accepted.append((path, face))
        if len(accepted) < 10:
            print(f"Warning: {class_dir.name} has only {len(accepted)} detected faces; collect more images.")
        validation_count = max(1, round(len(accepted) * args.validation_split)) if accepted else 0
        for index, (source_path, face) in enumerate(accepted):
            split = "val" if index < validation_count else "train"
            destination = args.output / split / class_dir.name / f"{index:04d}_{source_path.stem}.jpg"
            destination.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(destination), face)
        accepted_total += len(accepted)
        print(f"{class_dir.name}: {len(accepted)} cropped faces")

    if accepted_total == 0:
        raise SystemExit("No faces were detected. Use clear, front-facing portraits.")
    print(f"Prepared {accepted_total} faces in {args.output}")


if __name__ == "__main__":
    main()
