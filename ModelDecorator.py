from PIL import Image
from kraken import binarization, pageseg, rpred
from kraken.lib.models import load_any

def run(processed_img):
    pil_img = Image.fromarray(processed_img)
    pil_img_bw = binarization.nlbin(pil_img)
    lines = pageseg.segment(pil_img_bw)
    model = load_any("models/_best.mlmodel")
    predictions = rpred.rpred(model, pil_img_bw, lines)
    model_result = "\n".join([line.prediction for line in predictions])
    return model_result