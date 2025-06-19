import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import cv2
import pytesseract

import ModelDecorator
from utils.preprocessing import standard_preprocessing

def run(filepath):
    image = cv2.imread("../" + filepath)

    computer_text = image[350:700, :]
    handwritten_text = image[700:2800, :]

    cv2.imwrite(f'../cropped/computer/{filepath.split("/")[1]}', standard_preprocessing(computer_text))
    cv2.imwrite(f'../cropped/handwritten/{filepath.split("/")[1]}', standard_preprocessing(handwritten_text))

    tesseract_result = pytesseract.image_to_string(computer_text)

    model_result = ModelDecorator.run(standard_preprocessing(handwritten_text))

    print(model_result)

    return model_result, tesseract_result
