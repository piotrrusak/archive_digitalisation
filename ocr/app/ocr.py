from __future__ import annotations

import io
from pathlib import Path

from kraken import binarization, pageseg, rpred
from kraken.lib.models import load_any
from PIL import Image

_MODEL = None


def _get_model():
    global _MODEL
    if _MODEL is None:
        model_path = Path(__file__).resolve().parents[1] / "models" / "kraken.mlmodel"
        _MODEL = load_any(str(model_path), device="cpu")
    return _MODEL


def ocr_png_bytes(png_bytes):
    im = Image.open(io.BytesIO(png_bytes))
    bin_im = binarization.nlbin(im)

    bounds = pageseg.segment(bin_im)

    model = _get_model()
    records = rpred.rpred(model, bin_im, bounds)

    lines = [rec.prediction for rec in records]
    return "\n".join(lines)


def test_ocr(test_image_path):
    print(f"Testing OCR on image: {test_image_path}")
    png_bytes = test_image_path.read_bytes()
    text = ocr_png_bytes(png_bytes)
    print("OCR Result:")
    print("|" + text + "|")
    return text


if __name__ == "__main__" :
    test_ocr(Path(__file__).resolve().parent / "../tests/files/0.png")
    print()
    test_ocr(Path(__file__).resolve().parent / "../tests/files/1.png")
