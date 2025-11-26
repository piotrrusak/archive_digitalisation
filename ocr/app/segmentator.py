from __future__ import annotations

from io import BytesIO
from pathlib import Path

import numpy as np
import torch
from kraken import blla
from kraken.lib import vgsl
from PIL import Image
import logging



SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_PATH = SCRIPT_DIR / ".." / "models" / "seg_best_submitted.mlmodel"
_SEG_MODEL = None

TEXT_DIRECTION = "horizontal-lr"
PAD = 2
SAVE_DIR = SCRIPT_DIR / ".." / "temp" / "seg_lines"
BBOX_LINE_WIDTH = 5

def silence_segmentation_logs() :

    logging.getLogger("kraken.blla").setLevel(logging.ERROR)
    logging.getLogger("kraken").setLevel(logging.ERROR)

    logging.getLogger("shapely").setLevel(logging.ERROR)
    logging.getLogger("shapely.geos").setLevel(logging.ERROR)

    logging.getLogger("geos").setLevel(logging.ERROR)

def _ensure_pil_image(img):
    if isinstance(img, Image.Image):
        return img
    if isinstance(img, (bytes, bytearray, memoryview)):
        return Image.open(BytesIO(img))
    raise TypeError("img must be a PIL.Image.Image or bytes")


def _load_seg_model(device, seg_model_path=MODEL_PATH):
    global _SEG_MODEL
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    if _SEG_MODEL is None:
        m = vgsl.TorchVGSLModel.load_model(str(seg_model_path))
        m.nn.to(device)
        m.nn.eval()
        _SEG_MODEL = m
    else:
        _SEG_MODEL.nn.to(device)
        _SEG_MODEL.nn.eval()
    return _SEG_MODEL


def _bbox_from_line(line, im_w, im_h):
    if hasattr(line, "bbox") and line.bbox is not None:
        x0, y0, x1, y1 = map(int, line.bbox)
    elif hasattr(line, "boundary") and line.boundary:
        xs = [int(p[0]) for p in line.boundary]
        ys = [int(p[1]) for p in line.boundary]
        x0, x1 = min(xs), max(xs)
        y0, y1 = min(ys), max(ys)
    elif hasattr(line, "baseline") and line.baseline:
        xs = [int(p[0]) for p in line.baseline]
        ys = [int(p[1]) for p in line.baseline]
        x0, x1 = min(xs), max(xs)
        y_mid = int(round(sum(ys) / len(ys)))
        H = max(6, (im_h // 400))
        y0, y1 = y_mid - H, y_mid + H
    else:
        raise AttributeError("Line object has neither bbox, boundary nor baseline.")
    x0 = max(0, min(x0, im_w))
    x1 = max(0, min(x1, im_w))
    y0 = max(0, min(y0, im_h))
    y1 = max(0, min(y1, im_h))
    if x1 <= x0:
        x0, x1 = max(0, x0 - 1), min(im_w, x1 + 1)
    if y1 <= y0:
        y0, y1 = max(0, y0 - 1), min(im_h, y1 + 1)
    return int(x0), int(y0), int(x1), int(y1)


def segment_lines_from_image(
    img,
    *,
    device=None,
    text_direction="horizontal-lr",
    pad=0,
    return_mode="pil",
    seg_model_path=MODEL_PATH,
):
    im = _ensure_pil_image(img).convert("RGB")
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    seg_model = _load_seg_model(device=device, seg_model_path=seg_model_path)

    with torch.inference_mode():
        bounds = blla.segment(
            im,
            model=seg_model,
            device=device,
            text_direction=text_direction,
        )

    results = []
    for idx, line in enumerate(bounds.lines):
        x0, y0, x1, y1 = _bbox_from_line(line, im.width, im.height)

        if pad:
            x0 = max(0, x0 - pad)
            y0 = max(0, y0 - pad)
            x1 = min(im.width, x1 + pad)
            y1 = min(im.height, y1 + pad)

        crop = im.crop((x0, y0, x1, y1))

        base = getattr(line, "baseline", None)
        bound = getattr(line, "boundary", None)


        if base is not None:
            crop_baseline = [(px - x0, py - y0) for px, py in base]
        else:
            crop_baseline = None

        if bound:
            crop_boundary = [(px - x0, py - y0) for px, py in bound]
        else:
            crop_boundary = None

        item = {
            "index": idx,
            "bbox": (x0, y0, x1, y1),
            "baseline": crop_baseline,
            "boundary": crop_boundary,
            "type": getattr(line, "type", None),
            "tags": list(getattr(line, "tags", []) or []),
            "regions": list(getattr(line, "regions", []) or []),
        }
        if return_mode == "array":
            item["array"] = np.array(crop)
        else:
            item["pil_image"] = crop
        results.append(item)
    return results


def segment(im, seg_model_path=MODEL_PATH, filter_warnings = False, debug=False, frontline=""):

    if filter_warnings :
        silence_segmentation_logs()

    if debug:
        print(frontline + "Starting segmentation...")
    lines = segment_lines_from_image(
        im,
        text_direction=TEXT_DIRECTION,
        pad=PAD,
        return_mode="pil",
        seg_model_path=seg_model_path,
    )

    return lines


def debug_save(im, lines, save_dir=SAVE_DIR, frontline=""):
    img_arr = np.array(im.convert("RGB"))

    print(frontline + f"Found {len(lines)} lines:")
    save_dir.mkdir(parents=True, exist_ok=True)
    for item in lines:
        bbox = item["bbox"]
        x0, y0, x1, y1 = bbox
        img_arr[y0 - BBOX_LINE_WIDTH : y1 + BBOX_LINE_WIDTH, x0 - BBOX_LINE_WIDTH : x0] = (
            255,
            0,
            0,
        )
        img_arr[y0 - BBOX_LINE_WIDTH : y1 + BBOX_LINE_WIDTH, x1 : x1 + BBOX_LINE_WIDTH] = (
            255,
            0,
            0,
        )
        img_arr[y0 - BBOX_LINE_WIDTH : y0, x0 - BBOX_LINE_WIDTH : x1 + BBOX_LINE_WIDTH] = (
            255,
            0,
            0,
        )
        img_arr[y1 : y1 + BBOX_LINE_WIDTH, x0 - BBOX_LINE_WIDTH : x1 + BBOX_LINE_WIDTH] = (
            255,
            0,
            0,
        )

        baseline = item.get("baseline")
        if baseline :
            for (bx0, by0), (bx1, by1) in zip(baseline, baseline[1:]) :
                
                gx0, gy0 = int(bx0 + x0), int(by0 + y0)
                gx1, gy1 = int(bx1 + x0), int(by1 + y0)


                steps = max(abs(gx1 - gx0), abs(gy1 - gy0)) + 1
                xs = np.linspace(gx0, gx1, steps).astype(int)
                ys = np.linspace(gy0, gy1, steps).astype(int)

                for xx, yy in zip(xs, ys) :
                    if 0 <= yy < img_arr.shape[0] and 0 <= xx < img_arr.shape[1] :
                        for w_x in range(xx - BBOX_LINE_WIDTH, xx + BBOX_LINE_WIDTH + 1) :
                            for w_y in range(yy - BBOX_LINE_WIDTH, yy + BBOX_LINE_WIDTH + 1) :
                                if 0 <= w_y < img_arr.shape[0] and 0 <= w_x < img_arr.shape[1] :
                                    img_arr[w_y, w_x] = (0, 255, 0)
                                    
        boundary = item.get("boundary")
        if boundary and len(boundary) > 1 :
            for (bx0, by0), (bx1, by1) in zip(boundary, boundary[1:]) :
                gx0, gy0 = int(bx0 + x0), int(by0 + y0)
                gx1, gy1 = int(bx1 + x0), int(by1 + y0)

                steps = max(abs(gx1 - gx0), abs(gy1 - gy0)) + 1
                xs = np.linspace(gx0, gx1, steps).astype(int)
                ys = np.linspace(gy0, gy1, steps).astype(int)

                for xx, yy in zip(xs, ys) :
                    if 0 <= yy < img_arr.shape[0] and 0 <= xx < img_arr.shape[1] :
                        for w_x in range(xx - BBOX_LINE_WIDTH, xx + BBOX_LINE_WIDTH + 1) :
                            for w_y in range(yy - BBOX_LINE_WIDTH, yy + BBOX_LINE_WIDTH + 1) :
                                if 0 <= w_y < img_arr.shape[0] and 0 <= w_x < img_arr.shape[1] :
                                    img_arr[w_y, w_x] = (0, 0, 255)

    im_out = Image.fromarray(img_arr)
    im_out.save(save_dir / "segmented_image.png")

    print(frontline + f"Saved lines to directory: {save_dir.resolve()}")


if __name__ == "__main__":
    print(getattr(vgsl.TorchVGSLModel.load_model(str(MODEL_PATH)).nn, "model_type", None))
    IMAGE_PATH = SCRIPT_DIR / ".." / "model_training" / "data" / "0001.png"

    if SAVE_DIR.exists():
        for f in SAVE_DIR.iterdir():
            if f.is_file():
                f.unlink()
    else:
        SAVE_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Image: {IMAGE_PATH}")
    print(f"Model: {MODEL_PATH}")

    im = Image.open(IMAGE_PATH)

    lines = segment(im)
    debug_save(im, lines)
