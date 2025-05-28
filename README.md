# User Guide

## Input

In the input directory, you need to create a JSON file containing the test data in the following format:

```
[
  {
    "filepath": "dataset/0001.png",
    "text": "0001"
  },
  {
    "filepath": "dataset/0002.png",
    "text": "0002"
  },
  {
    "filepath": "dataset/0003.png",
    "text": ""
  },
  {
    "filepath": "dataset/0004.png",
    "text": ""
  },
  {
    "filepath": "dataset/0005.png",
    "text": ""
  }
]
```

filepath: Path to the input image.

text: Expected text output for the image.

If text is an empty string (""), the model's output will be compared with Tesseract’s output instead of a reference value.

## Output

The results are displayed in the standard output (logs). The log will indicate:


When the model is compared to the expected text from the JSON.

When the model is compared to Tesseract (if no expected text is provided).

## Additional Information

Cropped images containing printed or handwritten text are saved in the cropped directory.


To use your own model in the AutomatedTester, implement a function in the ModelDecorator.py file that wraps your model's inference logic.