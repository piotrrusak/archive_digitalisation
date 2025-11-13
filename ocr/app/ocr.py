from __future__ import annotations

import io
from pathlib import Path

from PIL import Image

# tests only. to be removed later
try:
    from app.file_converter import initialize_pdf_with_image, insert_text_at_bbox, pdf_to_bytes
    from app.module_loading import load_module_from_path
    from app.segmentator import debug_save, segment
except ImportError:
    try:
        from module_loading import load_module_from_path
        from segmentator import debug_save, segment

        from app.file_converter import initialize_pdf_with_image, insert_text_at_bbox, pdf_to_bytes
    except ImportError as e:
        raise ImportError("Failed to import necessary modules. Ensure the package structure is correct.") from e

MODEL_LIST = None


def get_model_list():
    global MODEL_LIST
    if MODEL_LIST is not None:
        return MODEL_LIST
    script_dir = Path(__file__).resolve().parents[1]
    model_dir = script_dir / "models" / "ocr_models"
    models = []
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
            desc = module.DESCRIPTION
            handle_func = module.handle
            print(desc)

            models.append(
                {
                    "name": name,
                    "id": count,
                    "description": desc,
                    "handle": handle_func,
                }
            )
            count += 1

    return models


def get_model_handler(id):
    global MODEL_LIST
    if MODEL_LIST is None:
        MODEL_LIST = get_model_list()
    for model in MODEL_LIST:
        if model["id"] == id:
            return model["handle"]


OUT_DIR = Path(__file__).resolve().parent / ".." / "temp"


def run_ocr(png_bytes, model_id, image_visibility=False):
    im = Image.open(io.BytesIO(png_bytes))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "debug_input.png").write_bytes(png_bytes)

    lines = segment(im)
    debug_save(im, lines, save_dir=OUT_DIR)

    ocr_handler = get_model_handler(model_id)
    text_lines: list[str] = []

    pdf_path = OUT_DIR / "ocr_overlay.pdf"
    pdf_doc = initialize_pdf_with_image(im, visible_image=image_visibility)

    for item in lines:
        x0, y0, x1, y1 = item["bbox"]
        line_im = im.crop((x0, y0, x1, y1))

        records = ocr_handler(line_im)

        line_txt = "".join(rec.prediction + "\n" for rec in records).strip()
        text_lines.append(line_txt)
        insert_text_at_bbox(pdf_doc, line_txt, item["bbox"], visible_image=image_visibility)

    pdf_doc.save(pdf_path)

    print(f"Saved OCR overlay PDF to: {pdf_path}")

    return pdf_to_bytes(pdf_doc)


def test_ocr(test_image_path, model_id=1):
    print(f"Testing OCR on image: {test_image_path}")
    png_bytes = test_image_path.read_bytes()
    run_ocr(png_bytes, model_id=model_id)


if __name__ == "__main__":
    test_ocr(Path(__file__).resolve().parent / "../model_training/data/0000.png", 1)
