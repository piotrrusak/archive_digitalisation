from __future__ import annotations

import io
from pathlib import Path

from kraken import binarization, pageseg, rpred
from kraken.lib.models import load_any
from PIL import Image

from app.pdf_converter import initialize_pdf_with_image, insert_text_at_bbox, pdf_to_bytes
from app.segmentator import debug_save, segment

_MODEL = None


def _get_model():
    global _MODEL
    if _MODEL is None:
        model_path = Path(__file__).resolve().parents[1] / "models" / "kraken.mlmodel"
        _MODEL = load_any(str(model_path), device="cpu")
    return _MODEL


OUT_DIR = Path(__file__).resolve().parent / ".." / "temp"


def run_ocr(png_bytes):
    im = Image.open(io.BytesIO(png_bytes))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "debug_input.png").write_bytes(png_bytes)

    lines = segment(im)
    debug_save(im, lines, save_dir=OUT_DIR)

    ocr_model = _get_model()
    text_lines: list[str] = []

    VISIBLE_IMAGE = False

    pdf_path = OUT_DIR / "ocr_overlay.pdf"
    pdf_doc = initialize_pdf_with_image(im, visible_image=VISIBLE_IMAGE)

    for item in lines:
        x0, y0, x1, y1 = item["bbox"]
        line_im = im.crop((x0, y0, x1, y1))
        bin_im = binarization.nlbin(line_im)
        bounds = pageseg.segment(bin_im)

        records = rpred.rpred(ocr_model, bin_im, bounds)
        line_txt = "".join(rec.prediction + "\n" for rec in records).strip()
        text_lines.append(line_txt)
        insert_text_at_bbox(pdf_doc, line_txt, item["bbox"], visible_image=VISIBLE_IMAGE)

    pdf_doc.save(pdf_path)

    print("\n".join(text_lines))

    return pdf_to_bytes(pdf_doc)


def test_ocr(test_image_path):
    print(f"Testing OCR on image: {test_image_path}")
    png_bytes = test_image_path.read_bytes()
    run_ocr(png_bytes)


if __name__ == "__main__":
    test_ocr(Path(__file__).resolve().parent / "../model_training/data/0000.png")
