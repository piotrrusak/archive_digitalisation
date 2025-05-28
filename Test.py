import cv2
import pytesseract

import ModelDecorator

def run(filepath):
    image = cv2.imread(filepath)

    computer_text = image[350:700, :]
    handwritten_text = image[700:2800, :]

    cv2.imwrite(f'cropped/computer/{filepath.split("/")[1]}', computer_text)
    cv2.imwrite(f'cropped/handwritten/{filepath.split("/")[1]}', handwritten_text)

    tesseract_result = pytesseract.image_to_string(computer_text)

    model_result = ModelDecorator.run(handwritten_text)

    return model_result, tesseract_result