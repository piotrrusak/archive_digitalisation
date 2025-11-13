from pathlib import Path

from kraken import binarization, pageseg, rpred
from kraken.lib.models import load_any

NAME = "Kraken OCR Model"
DESCRIPTION = """Kraken model"""

MODEL = None

MODEL_PATH = Path(__file__).resolve().parent / "kraken.mlmodel"


def load(model_path=MODEL_PATH):
    global MODEL
    MODEL = load_any(str(model_path), device="cpu")
    return MODEL


def handle(image):
    global MODEL
    if MODEL is None:
        load()
    bin_im = binarization.nlbin(image)
    bounds = pageseg.segment(bin_im)

    return rpred.rpred(MODEL, bin_im, bounds)
