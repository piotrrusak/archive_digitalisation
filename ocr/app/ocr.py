from __future__ import annotations

import io
import logging
from pathlib import Path

from PIL import Image

try:
    from app.file_converter import initialize_pdf_with_image, insert_text_at_bbox, pdf_to_bytes, pdf_to_docx_bytes
    from app.module_loading import load_module_from_path
    from app.segmentator import debug_save, segment
    from app.utils import get_frontline
except Exception:
    try:
        from file_converter import initialize_pdf_with_image, insert_text_at_bbox, pdf_to_bytes, pdf_to_docx_bytes
        from module_loading import load_module_from_path
        from segmentator import debug_save, segment
        from utils import get_frontline
    except Exception as e:
        raise ImportError("Failed to import necessary modules. Ensure the package structure is correct.") from e

logging.getLogger("kraken").setLevel(logging.ERROR)
logging.getLogger("kraken").propagate = False

logging.getLogger("pdfminer").setLevel(logging.ERROR)
logging.getLogger("pdfminer").propagate = False

MODEL_LIST = None
OUT_DIR = Path(__file__).resolve().parent / ".." / "temp"
INVERT_THRESHOLD = 0.3


def get_model_list():
    global MODEL_LIST
    if MODEL_LIST is not None:
        return MODEL_LIST
    script_dir = Path(__file__).resolve().parents[1]
    handlers_dir = script_dir / "models" / "ocr_models" / "handlers"
    models = []
    count = 1

    for handler_file in sorted(handlers_dir.glob("*.py")):
        module = load_module_from_path(handler_file)
        if not hasattr(module, "NAME") or not hasattr(module, "DESCRIPTION") or not hasattr(module, "handle"):
            continue
        logging.debug(f"Loaded OCR model handler: {handler_file.stem}")
        name = getattr(module, "NAME", handler_file.stem)
        desc = module.DESCRIPTION
        handle_func = module.handle

        models.append(
            {
                "name": name,
                "id": count,
                "description": desc,
                "handle": handle_func,
            }
        )
        count += 1
    logging.info(f"Total OCR model handlers loaded: {len(models)}")
    return models


def get_model_handler(id, debug=False, debug_indent=0):
    global MODEL_LIST
    if debug:
        logging.debug(get_frontline(debug_indent) + f"Retrieving handler for model ID: {id}")
    if MODEL_LIST is None:
        if debug:
            logging.debug(get_frontline(debug_indent) + "Loading model list...")
        MODEL_LIST = get_model_list()
        if debug:
            logging.debug(get_frontline(debug_indent) + f"Loaded {len(MODEL_LIST)} models.")
    default_handler = None
    for model in MODEL_LIST:
        if model["id"] == id:
            if debug:
                logging.debug(get_frontline(debug_indent) + f"Found handler for model ID: {id}")
            return model["handle"]
        if model["id"] == 1:
            default_handler = model["handle"]
    if debug:
        logging.debug(get_frontline(debug_indent) + f"Model ID: {id} not found, using default model ID: 1")
    return default_handler


def run_ocr(png_bytes, model_id, image_visibility=False, one_liner=False, debug=False, debug_indent=0):
    if debug:
        logging.debug(get_frontline(debug_indent) + f"Starting OCR with model ID: {model_id}")
    im = Image.open(io.BytesIO(png_bytes))

    histogram = im.convert("L").histogram()
    dark_ratio = sum(histogram[:128]) / sum(histogram)

    if dark_ratio > INVERT_THRESHOLD:
        if debug:
            logging.debug(get_frontline(debug_indent) + f"Inverting image (dark ratio: {dark_ratio:.2f})")
        im = Image.eval(im, lambda x: 255 - x)

    if debug:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        (OUT_DIR / "debug_input.png").write_bytes(png_bytes)

    if not one_liner:
        lines = segment(im, debug=debug, frontline=get_frontline(debug_indent + 1))
        if debug:
            debug_save(im, lines, save_dir=OUT_DIR, frontline=get_frontline(debug_indent + 2))
            logging.debug(get_frontline(debug_indent + 1) + "Segmentation finished")
    else:
        lines = [{"bbox": (0, 0, im.width, im.height)}]

    ocr_handler = get_model_handler(model_id, debug=debug, debug_indent=debug_indent + 1)
    lines_data: list[str] = []

    pdf_path = OUT_DIR / "ocr_overlay.pdf"
    if debug:
        logging.debug(
            get_frontline(debug_indent) + f"Initializing PDF document with image visibility set to: {image_visibility}"
        )
    pdf_doc = initialize_pdf_with_image(im, visible_image=image_visibility)
    if debug:
        logging.debug(get_frontline(debug_indent) + "PDF document initialized")

    for item in lines:
        x0, y0, x1, y1 = item["bbox"]
        line_im = im.crop((x0, y0, x1, y1))

        if debug:
            logging.debug(get_frontline(debug_indent) + f"Running OCR on line with bbox: {item['bbox']}")
        line_txt = ocr_handler(line_im, item, debug=debug, frontline=get_frontline(debug_indent + 1))
        if debug:
            logging.debug(get_frontline(debug_indent) + "OCR result: " + line_txt)

        lines_data.append({"text": line_txt, "bbox": item["bbox"]})

    from postprocessor import postprocess
    lines_txt = [item["text"] for item in lines_data]
    lines_txt = postprocess(lines_txt)
    for i, item in enumerate(lines_data):
        item["text"] = lines_txt[i]

    for item in lines_data:
        insert_text_at_bbox(pdf_doc, item["text"], item["bbox"], visible_image=image_visibility)

    if debug:
        pdf_doc.save(pdf_path)
        logging.debug(get_frontline(debug_indent) + f"Saved OCR overlay PDF to: {pdf_path}")

    pdf_bytes = pdf_to_bytes(pdf_doc)
    docx_bytes = pdf_to_docx_bytes(pdf_doc)
    return pdf_bytes, docx_bytes


def test_ocr(test_image_path, model_id=1, one_liner=False, debug=True, debug_indent=0):
    if debug:
        logging.debug(get_frontline(debug_indent) + f"Testing OCR on image: {test_image_path}")
    png_bytes = test_image_path.read_bytes()
    run_ocr(png_bytes, model_id=model_id, one_liner=one_liner, debug=debug, debug_indent=debug_indent + 1)


if __name__ == "__main__":
    # test_ocr(Path(__file__).resolve().parent / "../model_training/data/0000.png", 1, True)
    from run import setup_logging
    setup_logging()
    test_ocr(
        Path(__file__).resolve().parent / "../model_training/data/0000.png",
        model_id=1,
        #  one_liner=True,
        debug=True,
    )
    # get_model_list()
