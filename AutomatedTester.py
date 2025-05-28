import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import logging
logger = logging.getLogger(__name__)

from Logger import setup_logging
setup_logging(logging.INFO) # logging.INFO/logging.WARNING/logging.ERROR/logging.DEBUG

import json
import Levenshtein

import Test

class AutomatedTester:

    def __init__(self, dataset_json):
        with open(dataset_json, 'r', encoding='utf-8') as file:
            self.files = json.load(file)
        for file in self.files:
            model_result, tesseract_result = Test.run(file['filepath'])
            if len(file['text']) != 0:
                logger.log(logging.INFO, f"While processing \"{file['filepath']}\", lavenshtein distance between model and data from input is {Levenshtein.distance(model_result, file['text'])}.")
            else:
                logger.log(logging.INFO, f"While processing \"{file['filepath']}\", lavenshtein distance between model and tesseract scanning computer text is {Levenshtein.distance(model_result, tesseract_result)}.")

if __name__ == '__main__':
    automated_tester = AutomatedTester("input/dataset.json")