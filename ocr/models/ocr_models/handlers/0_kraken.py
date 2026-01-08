import logging
from pathlib import Path

from kraken import binarization, containers, pageseg, rpred
from kraken.lib.models import load_any
from PIL import Image

NAME = "Kraken OCR Model"
DESCRIPTION = """Kraken model - Accuracy ~ 85%"""

MODEL = None

MODEL_PATH = Path(__file__).resolve().parent / ".." / "ocr_best_submitted.mlmodel"
TEXT_DIRECTION = "horizontal-lr"


def load(model_path=MODEL_PATH):
    global MODEL
    MODEL = load_any(str(model_path), device="cpu")
    return MODEL


def handle(image, seg_info=None, debug=False, frontline="", filter_warnings=False):
    global MODEL
    if MODEL is None:
        load()

    if debug:
        logging.debug(frontline + f"Using model: {MODEL_PATH.name}")
    if filter_warnings:
        import warnings

        warnings.filterwarnings(
            "ignore", message="Using legacy polygon extractor, as the model was not trained with the new method."
        )
        logging.getLogger("kraken").setLevel(logging.ERROR)

    margin_percentage = 0
    margin = min(image.width, image.height) * margin_percentage
    new_width = int(image.width + (2 * margin))
    new_height = int(image.height + (2 * margin))
    new_image = image.resize((new_width, new_height), Image.LANCZOS)
    bin_im = binarization.nlbin(new_image)
    output = ""
    try:
        output = "".join(rec.prediction for rec in list(rpred.rpred(MODEL, bin_im, pageseg.segment(bin_im))))
        if len(output) == 0:
            raise Exception("Empty output from automatic segmentation")
        else:
            if debug:
                logging.debug(frontline + "Used automatic segmentation")
    except Exception:
        if seg_info is None:
            seg_info = {}
        output = "".join(
            rec.prediction
            for rec in list(
                rpred.rpred(
                    MODEL,
                    bin_im,
                    containers.Segmentation(
                        type="baselines",
                        imagename="",
                        text_direction=TEXT_DIRECTION,
                        script_detection=False,
                        lines=[
                            containers.BaselineLine(
                                id=str(seg_info.get("index", 0)),
                                baseline=[
                                    (margin, new_image.height - margin - 1),
                                    (new_image.width - margin - 1, new_image.height - margin - 1),
                                ],
                                boundary=[
                                    (0, 0),
                                    (new_image.width - 1, 0),
                                    (new_image.width - 1, new_image.height - 1),
                                    (0, new_image.height - 1),
                                ],
                            )
                        ],
                        regions={},
                        line_orders=[[0]],
                    ),
                )
            )
        )
        if debug:
            logging.debug(frontline + "Used provided segmentation")

    return output
