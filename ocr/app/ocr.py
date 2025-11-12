from __future__ import annotations

import io
from pathlib import Path

from PIL import Image

# tests only. to be removed later
try:
    from app.pdf_converter import initialize_pdf_with_image, insert_text_at_bbox, pdf_to_bytes
    from app.segmentator import debug_save, segment
    from app.module_loading import load_module_from_path
except ImportError:
    from pdf_converter import initialize_pdf_with_image, insert_text_at_bbox, pdf_to_bytes
    from segmentator import debug_save, segment
    from module_loading import load_module_from_path

MODEL_LIST = None

def get_model_list():
    script_dir = Path(__file__).resolve().parents[1]
    model_dir = script_dir / "models" / "ocr_models"
    model_files = []
    count = 1

    for handler_file in model_dir.glob("*.py"):
        model_file = None
        for model_file in model_dir.glob(f"{handler_file.stem}.*"):
            if model_file.suffix != ".txt":
                model_file = model_file
                break
        if model_file:
            print(f"Found model: {handler_file.name} -> {model_file.name}")
            
            module = load_module_from_path(handler_file)
            print(f"Loaded module: {module}")
            if not hasattr(module, "NAME") or not hasattr(module, "DESCRIPTION") or not hasattr(module, "handle"):
                print(f"  [warning] Model module {handler_file.name} is missing NAME, DESCRIPTION or handle()")
                continue
            
            name = getattr(module, "NAME", handler_file.stem)
            desc = getattr(module, "DESCRIPTION")
            handle_func = getattr(module, "handle")
            print(desc)

            model_files.append({"name": name,
                                "id": count,
                                "description": desc,
                                "handle": handle_func,
                                })
            count += 1

    return model_files


def get_model_handler(id):
    if MODEL_LIST is None:
        MODEL_LIST = get_model_list()
    for model in MODEL_LIST:
        if model["id"] == id:
            return model["handle"]


OUT_DIR = Path(__file__).resolve().parent / ".." / "temp"


def run_ocr(png_bytes, model_id):
    im = Image.open(io.BytesIO(png_bytes))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "debug_input.png").write_bytes(png_bytes)

    lines = segment(im)
    debug_save(im, lines, save_dir=OUT_DIR)

    ocr_handler = get_model_handler(model_id)
    text_lines: list[str] = []

    pdf_path = OUT_DIR / "ocr_overlay.pdf"
    pdf_doc = initialize_pdf_with_image(im)

    for item in lines:
        x0, y0, x1, y1 = item["bbox"]
        line_im = im.crop((x0, y0, x1, y1))

        records = ocr_handler(line_im)

        line_txt = "".join(rec.prediction + "\n" for rec in records).strip()
        text_lines.append(line_txt)
        insert_text_at_bbox(pdf_doc, line_txt, item["bbox"])

    pdf_doc.save(pdf_path)

    print("\n".join(text_lines))

    return pdf_to_bytes(pdf_doc)


def test_ocr(test_image_path):
    print(f"Testing OCR on image: {test_image_path}")
    png_bytes = test_image_path.read_bytes()
    text = run_ocr(png_bytes)


if __name__ == "__main__":
    # test_ocr(Path(__file__).resolve().parent / "../model_training/data/0000.png")
    model_files = get_model_list()
    print(f"Available models: {model_files}")
