from pathlib import Path
import json
from backend.app import ModelStore, crop_largest_face
from PIL import Image

print('model exists', Path('models/hero_classifier.keras').exists())
print('labels exists', Path('models/labels.json').exists())
if Path('models/labels.json').exists():
    print('labels', json.loads(Path('models/labels.json').read_text())['labels'][:10])

ModelStore.load()
print('model loaded', ModelStore.model is not None, 'error', ModelStore.error)

for p in sorted(Path('dataset/raw').glob('**/*')):
    if p.is_file() and p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
        try:
            img = Image.open(p)
            face = crop_largest_face(img)
            print('detected', p, face.shape)
            break
        except Exception as exc:
            print('failed', p, type(exc).__name__, exc)
            
