from __future__ import annotations
import os
import json
import numpy as np
from pathlib import Path
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
JSON_DIR = os.path.join(SCRIPT_DIR, "input")

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    json_path = os.path.join(JSON_DIR, "dataset.json")
    ds = json.loads(Path(json_path).read_text(encoding="utf-8"))
    for item in ds:
        rel_path = item["filepath"]
        img_path = (Path(DATA_DIR) / Path(rel_path).name).resolve()
        name = item.get("name") or Path(rel_path).stem
        if not img_path.exists():
            raise FileNotFoundError(f"Image not found: {img_path}")

        with Image.open(img_path) as im:
            arr = np.array(im)

        if arr.dtype != np.uint8:
            arr = arr.astype(np.uint8)
        
        UPPER_LINE_CROP = 620
        LOWER_LINE_CROP = 2700

        arr = arr[UPPER_LINE_CROP:LOWER_LINE_CROP]

        lines = item.get("lines", [])
        for line in lines :
            line['bbox'][1] -= UPPER_LINE_CROP
            line['bbox'][3] -= UPPER_LINE_CROP

            # arr[line['bbox'][1]:line['bbox'][3], line['bbox'][0]] = 0
            # arr[line['bbox'][1]:line['bbox'][3], line['bbox'][2]] = 0
            # arr[line['bbox'][1], line['bbox'][0]:line['bbox'][2]] = 0
            # arr[line['bbox'][3], line['bbox'][0]:line['bbox'][2]] = 0


        arr[:lines[0]['bbox'][1]] = 255
        arr[lines[-1]['bbox'][3]:] = 255
        arr[:, :min(lines, key = lambda x: x['bbox'][0])['bbox'][0]] = 255
        arr[:, max(lines, key = lambda x: x['bbox'][2])['bbox'][2]:] = 255

        tolerance = 0.5

        for y in range(arr.shape[0]) :
            for x in range(arr.shape[1]) :
                if arr[y, x] < 255*tolerance :
                    arr[y, x] = 0
                else :
                    arr[y, x] = 255

        item['lines'] = lines
        
        out_im = Image.fromarray(arr)
        out_path = Path(DATA_DIR) / f"{name}.png"
        out_im.save(out_path)
        print(f"OK: {img_path.name} -> {out_path.name}")



    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(ds, f, ensure_ascii=False, indent=4)


if __name__ == "__main__":
    main()
