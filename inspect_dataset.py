from pathlib import Path
root = Path('dataset/raw')
for folder in sorted(root.iterdir()):
    if folder.is_dir():
        files = [p.name for p in folder.iterdir() if p.is_file()]
        print(folder.name, len(files), files[:10])
