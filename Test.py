import cv2
from PIL import Image
from kraken import binarization, pageseg, rpred
from kraken.lib.models import load_any
import pytesseract

import ModelDecorator
from utils.preprocessing import standard_preprocessing

def run(filepath):
    image = cv2.imread(filepath)

    computer_text = image[350:700, :]
    handwritten_text = image[700:2800, :]

    cv2.imwrite(f'cropped/computer/{filepath.split("/")[1]}', standard_preprocessing(computer_text))
    cv2.imwrite(f'cropped/handwritten/{filepath.split("/")[1]}', standard_preprocessing(handwritten_text))

    tesseract_result = pytesseract.image_to_string(computer_text)

    processed_img = standard_preprocessing(handwritten_text)

    model_result = ModelDecorator.run(processed_img)

    print(model_result)

    return model_result, tesseract_result
