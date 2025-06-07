import cv2
from PIL import Image
from kraken import binarization, pageseg, rpred
from kraken.lib.models import load_any
import pytesseract

from preprocessing import standard_preprocessing

def run(filepath):
    image = cv2.imread(filepath)

    computer_text = image[350:700, :]
    handwritten_text = image[700:2800, :]

    cv2.imwrite(f'cropped/computer/{filepath.split("/")[1]}', standard_preprocessing(computer_text))
    cv2.imwrite(f'cropped/handwritten/{filepath.split("/")[1]}', standard_preprocessing(handwritten_text))

    tesseract_result = pytesseract.image_to_string(computer_text)

    processed_img = standard_preprocessing(handwritten_text)
    pil_img = Image.fromarray(processed_img)
    pil_img_bw = binarization.nlbin(pil_img)
    lines = pageseg.segment(pil_img_bw)
    model = load_any("models/trained_model_best.mlmodel")
    predictions = rpred.rpred(model, pil_img_bw, lines)

    model_result = "\n".join([line.prediction for line in predictions])

    print(model_result)

    return model_result, tesseract_result
