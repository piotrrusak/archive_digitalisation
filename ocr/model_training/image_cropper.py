from __future__ import annotations
import os, json
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(SCRIPT_DIR, "data")
JSON_PATH = os.path.join(os.path.join(SCRIPT_DIR, "input"), "dataset.json")

DOWNSCALE_FACTOR = 1

def handle_record(item) :
    filepath = os.path.join(SCRIPT_DIR, item["filepath"])

    img_arr = np.array(Image.open(filepath))

    lines = item.get("lines", [])
    min_x0 = max(min(ln["bbox"][0] for ln in lines), 1) - 1
    min_y0 = max(min(ln["bbox"][1] for ln in lines), 1) - 1
    max_x1 = min(max(ln["bbox"][2] for ln in lines), img_arr.shape[1] - 1) + 1
    max_y1 = min(max(ln["bbox"][3] for ln in lines), img_arr.shape[0] - 1) + 1

    new_image = (np.random.power(50, size=img_arr.shape[:2]) * 255).astype(np.uint8)

    new_image[min_y0:max_y1, min_x0:max_x1] = img_arr[min_y0:max_y1, min_x0:max_x1]
    img_crop = new_image

    img_crop = cv2.resize(img_crop, (0, 0), fx=1/DOWNSCALE_FACTOR, fy=1/DOWNSCALE_FACTOR)
    for ln in lines :
        ln["bbox"][0] = int(ln["bbox"][0] / DOWNSCALE_FACTOR)
        ln["bbox"][1] = int(ln["bbox"][1] / DOWNSCALE_FACTOR)
        ln["bbox"][2] = int(ln["bbox"][2] / DOWNSCALE_FACTOR)
        ln["bbox"][3] = int(ln["bbox"][3] / DOWNSCALE_FACTOR)

    img_crop_pil = Image.fromarray(img_crop)
    img_crop_pil.save(filepath)

def main() :
    os.makedirs(DATA_DIR, exist_ok=True)
    ds = json.loads(Path(JSON_PATH).read_text(encoding="utf-8"))
    for item in ds :
        handle_record(item)


if __name__ == "__main__" :
    main()
