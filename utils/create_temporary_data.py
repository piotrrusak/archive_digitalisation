"""segment_and_generate_training_data.py

Generuje dane treningowe z ręcznie pisanych skanów.
Dla każdego rekordu w test.json:
* segmentuje obraz na wiersze przy pomocy Kraken OCR,
* wycina każdy wiersz do osobnego pliku PNG w ../temporary_data.

Wymagania:
    pip install kraken pillow
"""

from __future__ import annotations

import json
from pathlib import Path
from PIL import Image
from kraken import binarization, pageseg

# ---------- Segmentacja ----------------------------------------------------

def segment_lines(image_path: Path):
    """Segmentuje obraz na wiersze przy użyciu Kraken OCR."""
    image = Image.open(image_path)
    bw = binarization.nlbin(image)  # binarize with Kraken
    seg_result = pageseg.segment(bw, text_direction='horizontal-lr')
    return [line.bounds for line in seg_result.lines]  # poprawne pobranie bbox-ów

# ---------- Główna logika --------------------------------------------------

def create_train_data():
    """Czyta test.json i zapisuje segmenty do ../temporary_data."""
    root = Path(__file__).resolve().parent
    input_json = root / ".." / "input" / "test.json"
    images_dir = root / ".." / "cropped" / "handwritten"
    out_dir = root / ".." / "temporary_data"
    out_dir.mkdir(parents=True, exist_ok=True)

    with input_json.open(encoding="utf-8") as f:
        records = json.load(f)

    for element in records:
        name = element["name"]
        image_path = images_dir / f"{name}.png"
        try:
            boxes = segment_lines(image_path)
        except Exception as e:
            print(f"[WARN] problem z segmentacją {image_path}: {e}")
            continue

        image = Image.open(image_path)
        for i, box in enumerate(boxes, start=1):
            x1, y1, x2, y2 = box
            region = image.crop((x1, y1, x2, y2))
            base = f"{name}_{i:04}"
            region.save(out_dir / f"{base}.png")


if __name__ == "__main__":
    create_train_data()

    import subprocess

    def run_kraken_segmentation(image_path, seg_path):
        if not seg_path.exists():
            try:
                subprocess.run(
                    ["kraken", "-i", str(image_path), str(seg_path), "segment"],
                    check=True
                )
            except subprocess.CalledProcessError as e:
                print(f"[ERR] Błąd podczas segmenta-cji obrazu {image_path}: {e}")