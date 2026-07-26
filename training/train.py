"""Train an EfficientNet face classifier from the prepared hero portrait folders."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import tensorflow as tf

AUTOTUNE = tf.data.AUTOTUNE


def make_model(class_count: int, image_size: int) -> tuple[tf.keras.Model, tf.keras.Model]:
    augment = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.06),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomContrast(0.12),
        ],
        name="portrait_augmentation",
    )
    base = tf.keras.applications.EfficientNetB0(
        include_top=False, weights="imagenet", input_shape=(image_size, image_size, 3)
    )
    base.trainable = False
    inputs = tf.keras.Input(shape=(image_size, image_size, 3), name="portrait")
    features = base(augment(inputs), training=False)
    features = tf.keras.layers.GlobalAveragePooling2D()(features)
    features = tf.keras.layers.Dropout(0.35)(features)
    outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="identity")(features)
    return tf.keras.Model(inputs, outputs, name="hero_face_classifier"), base


def compile_model(model: tf.keras.Model, learning_rate: float) -> None:
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.03),
        metrics=["accuracy", tf.keras.metrics.TopKCategoricalAccuracy(k=3, name="top_3_accuracy")],
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a hero face classifier.")
    parser.add_argument("--data", type=Path, default=Path("dataset/faces"))
    parser.add_argument("--output", type=Path, default=Path("models/hero_classifier.keras"))
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--batch-size", type=int, default=24)
    parser.add_argument("--epochs", type=int, default=16)
    parser.add_argument("--fine-tune-epochs", type=int, default=8)
    args = parser.parse_args()

    train_path, validation_path = args.data / "train", args.data / "val"
    if not train_path.is_dir() or not validation_path.is_dir():
        raise SystemExit("Prepared train/ and val/ folders are missing. Run prepare_dataset.py first.")

    train_set = tf.keras.utils.image_dataset_from_directory(
        train_path, label_mode="categorical", image_size=(args.image_size, args.image_size),
        batch_size=args.batch_size, shuffle=True, seed=42,
    )
    labels = train_set.class_names
    validation_set = tf.keras.utils.image_dataset_from_directory(
        validation_path, label_mode="categorical", class_names=labels,
        image_size=(args.image_size, args.image_size), batch_size=args.batch_size, shuffle=False,
    )
    train_set = train_set.prefetch(AUTOTUNE)
    validation_set = validation_set.prefetch(AUTOTUNE)
    print(f"Training labels: {', '.join(labels)}")

    model, base = make_model(len(labels), args.image_size)
    compile_model(model, 1e-3)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    checkpoint_path = args.output.with_name("best_hero_classifier.keras")
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(checkpoint_path, monitor="val_accuracy", save_best_only=True),
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", patience=2, factor=0.35, min_lr=1e-6),
    ]
    model.fit(train_set, validation_data=validation_set, epochs=args.epochs, callbacks=callbacks)

    # Tune only the final convolution blocks; this adapts the visual features without erasing ImageNet knowledge.
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    compile_model(model, 1e-5)
    model.fit(train_set, validation_data=validation_set, epochs=args.fine_tune_epochs, callbacks=callbacks)

    best_model = tf.keras.models.load_model(checkpoint_path)
    best_model.save(args.output)
    labels_path = args.output.parent / "labels.json"
    labels_path.write_text(
        json.dumps({"labels": labels, "image_size": args.image_size}, indent=2), encoding="utf-8"
    )
    print(f"Saved model to {args.output}")
    print(f"Saved label map to {labels_path}")


if __name__ == "__main__":
    main()
