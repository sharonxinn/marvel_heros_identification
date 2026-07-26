# Vision Archive — real Marvel hero face classifier

Vision Archive is a cinematic web interface that identifies a portrait with a **locally trained** model and then unlocks the matched hero's story. It no longer guesses from a hard-coded result: the browser sends the uploaded image to the API, and the API returns the actual model prediction.

## 1. Create the labelled dataset

Add clear, front-facing and properly licensed portrait images to these exact folders:

```text
dataset/raw/
  iron_man/
  spider_man/
  doctor_strange/
  black_panther/
  thor/
  loki/
  black_widow/
  captain_america/
  scarlet_witch/
```

The class name is the only identity mapping used by the model. Keep every class balanced; target **300–1,000 images per hero**. Include normal variation (lighting, facial expression, pose, age) and avoid near-duplicate movie frames. The frontend only has story content for the eight names above, so keep them exact.

> Use only images that you are allowed to use. If personal portraits are involved, obtain consent and clearly explain the purpose of the classifier.

## 2. Install the Python environment

Use Python 3.10–3.12.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 3. Detect faces and create train/validation splits

```powershell
python training/prepare_dataset.py
```

This crops the largest detected face from each source image and writes an 80/20 split to `dataset/faces/train` and `dataset/faces/val`. If you intentionally want to replace a prior generated split, run:

```powershell
python training/prepare_dataset.py --replace
```

## 4. Train the model

```powershell
python training/train.py
```

The trainer uses EfficientNetB0 transfer learning, image augmentation, early stopping, and a fine-tuning phase. It creates:

```text
models/hero_classifier.keras
models/labels.json
```

Before relying on it, test with held-out portraits for every hero. If Loki is classified as Black Panther, that is a training/data problem—not an interface problem. Add more diverse examples for both classes, remove mislabeled/duplicate images, and retrain. The API also rejects a prediction below its confidence threshold (65% by default) instead of returning an arbitrary label.

Run this after each training session to see exactly which heroes are confused:

```powershell
python training/evaluate.py
```

It prints a confusion matrix and saves it as `models/evaluation.json`. In particular, inspect Loki → Black Panther errors before shipping a new model.

## 5. Run the model API and website

Keep the API running in one terminal:

```powershell
uvicorn backend.app:app --reload
```

Then serve the website from the project folder in a second terminal:

```powershell
python -m http.server 5500
```

Open [http://127.0.0.1:5500](http://127.0.0.1:5500). The scanner header will say `MODEL ONLINE` when the trained model is loaded. Upload a portrait or use the camera; the site calls `POST /api/classify` and displays only the returned label.

## Background music

Use the `SOUND: OFF` control in the top-right corner to start the SoundCloud track selected for this project. It is embedded from SoundCloud rather than downloaded or copied into the project, and it starts only after a click because browsers block autoplay audio.

## API response

```json
{
  "label": "loki",
  "confidence": 0.91,
  "top_predictions": [
    { "label": "loki", "confidence": 0.91 },
    { "label": "thor", "confidence": 0.06 }
  ]
}
```

If a face cannot be found, the service returns an error. If the best model confidence is lower than `MIN_CONFIDENCE` (default `0.65`), it returns **no verified match** rather than a wrong character. To change the threshold for one session:

```powershell
$env:MIN_CONFIDENCE = "0.75"
uvicorn backend.app:app --reload
```
