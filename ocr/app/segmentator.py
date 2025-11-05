from __future__ import annotations
from pathlib import Path
from io import BytesIO

from PIL import Image
import torch
from kraken import blla
from kraken.lib import vgsl
import numpy as np

SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR / ".." / "models" / "seg_best.mlmodel"
_SEG_MODEL = None

def _ensure_pil_image(img) :
    if isinstance(img, Image.Image) :
        return img
    if isinstance(img, (bytes, bytearray, memoryview)) :
        return Image.open(BytesIO(img))
    raise TypeError("img must be a PIL.Image.Image or bytes")

def _load_seg_model(device) :
    global _SEG_MODEL
    if device is None :
        device = "cuda" if torch.cuda.is_available() else "cpu"
    if _SEG_MODEL is None :
        m = vgsl.TorchVGSLModel.load_model(str(MODEL_PATH))
        m.nn.to(device)
        m.nn.eval()
        _SEG_MODEL = m
    else :
        _SEG_MODEL.nn.to(device)
        _SEG_MODEL.nn.eval()
    return _SEG_MODEL

def _bbox_from_line(line, im_w, im_h) :
    if hasattr(line, "bbox") and line.bbox is not None :
        x0, y0, x1, y1 = map(int, line.bbox)
    elif hasattr(line, "boundary") and line.boundary :
        xs = [int(p[0]) for p in line.boundary]
        ys = [int(p[1]) for p in line.boundary]
        x0, x1 = min(xs), max(xs)
        y0, y1 = min(ys), max(ys)
    elif hasattr(line, "baseline") and line.baseline :
        xs = [int(p[0]) for p in line.baseline]
        ys = [int(p[1]) for p in line.baseline]
        x0, x1 = min(xs), max(xs)
        y_mid = int(round(sum(ys) / len(ys)))
        H = max(6, (im_h // 400))
        y0, y1 = y_mid - H, y_mid + H
    else :
        raise AttributeError("Line object has neither bbox, boundary nor baseline.")
    x0 = max(0, min(x0, im_w))
    x1 = max(0, min(x1, im_w))
    y0 = max(0, min(y0, im_h))
    y1 = max(0, min(y1, im_h))
    if x1 <= x0: x0, x1 = max(0, x0 - 1), min(im_w, x1 + 1)
    if y1 <= y0: y0, y1 = max(0, y0 - 1), min(im_h, y1 + 1)
    return int(x0), int(y0), int(x1), int(y1)

def segment_lines_from_image(
    img,
    *,
    device = None,
    text_direction = "horizontal-lr",
    pad = 0,
    return_mode = "pil",
) :
    im = _ensure_pil_image(img).convert("RGB")
    if device is None :
        device = "cuda" if torch.cuda.is_available() else "cpu"

    seg_model = _load_seg_model(device = device)

    with torch.inference_mode() :
        bounds = blla.segment(
            im,
            model = seg_model,
            device = device,
            text_direction = text_direction,
        )

    results = []
    for idx, line in enumerate(bounds.lines) :
        x0, y0, x1, y1 = _bbox_from_line(line, im.width, im.height)

        if pad :
            x0 = max(0, x0 - pad)
            y0 = max(0, y0 - pad)
            x1 = min(im.width,  x1 + pad)
            y1 = min(im.height, y1 + pad)

        crop = im.crop((x0, y0, x1, y1))

        item = {
            "index": idx,
            "bbox": (x0, y0, x1, y1),
            "baseline": getattr(line, "baseline", None),
            "boundary": getattr(line, "boundary", None),
            "type": getattr(line, "type", None),
            "tags": list(getattr(line, "tags", []) or []),
            "regions": list(getattr(line, "regions", []) or []),
        }
        if return_mode == "array" :
            item["array"] = np.array(crop)
        else :
            item["pil_image"] = crop
        results.append(item)
    return results

if __name__ == "__main__" :
    print(getattr(vgsl.TorchVGSLModel.load_model(str(MODEL_PATH)).nn, "model_type", None))
    IMAGE_PATH = SCRIPT_DIR / ".." / "model_training" / "data" / "0001.png"
    SAVE_DIR = SCRIPT_DIR / ".." / "temp" / "seg_lines"

    SAVE_LINES = False
    BBOX_LINE_WIDTH = 5

    if SAVE_DIR.exists():
        for f in SAVE_DIR.iterdir():
            if f.is_file():
                f.unlink()
    else:
        SAVE_DIR.mkdir(parents=True, exist_ok=True)

    TEXT_DIRECTION = "horizontal-lr"
    PAD = 2

    print(f"Image: {IMAGE_PATH}")
    print(f"Model: {MODEL_PATH}")

    im = Image.open(IMAGE_PATH)

    print("[DEBUG] Starting segmentation...")
    lines = segment_lines_from_image(
        im,
        text_direction=TEXT_DIRECTION,
        pad=PAD,
        return_mode="pil",
    )


    img_arr = np.array(im.convert("RGB"))

    print(f"Found {len(lines)} lines:")
    SAVE_DIR.mkdir(parents=True, exist_ok=True)
    for item in lines:
        idx = item["index"]
        bbox = item["bbox"]
        if SAVE_LINES :
            item["pil_image"].save(SAVE_DIR / f"line_{idx:03d}.png")
        else :
            x0, y0, x1, y1 = bbox
            img_arr[y0-BBOX_LINE_WIDTH:y1+BBOX_LINE_WIDTH, x0-BBOX_LINE_WIDTH:x0] = (255, 0, 0)
            img_arr[y0-BBOX_LINE_WIDTH:y1+BBOX_LINE_WIDTH, x1:x1+BBOX_LINE_WIDTH] = (255, 0, 0)
            img_arr[y0-BBOX_LINE_WIDTH:y0, x0-BBOX_LINE_WIDTH:x1+BBOX_LINE_WIDTH] = (255, 0, 0)
            img_arr[y1:y1+BBOX_LINE_WIDTH, x0-BBOX_LINE_WIDTH:x1+BBOX_LINE_WIDTH] = (255, 0, 0)
    if not SAVE_LINES :
        im_out = Image.fromarray(img_arr)
        im_out.save(SAVE_DIR / "segmented_image.png")

    print(f"Saved lines to directory: {SAVE_DIR.resolve()}")
