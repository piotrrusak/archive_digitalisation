import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json

import cv2
from preprocessing import standard_preprocessing

def run(json_path):
    with open(json_path) as f:
        dataset = json.load(f)

    for element in dataset:

        image = cv2.imread(element["filepath"])

        computer_text = image[350:700, :]
        handwritten_text = image[700:2800, :]

        cv2.imwrite(f'cropped/computer/{element["filepath"].split("/")[1]}', standard_preprocessing(computer_text))
        cv2.imwrite(f'cropped/handwritten/{element["filepath"].split("/")[1]}', standard_preprocessing(handwritten_text))

if __name__ == '__main__':
    filepath = sys.stdin.read()[0:-1]
    run(filepath)