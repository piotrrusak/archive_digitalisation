# User Guide

## Input

In the input directory, you need to create a JSON file containing the test data in the following format:

```
[
  {
    "filepath": "dataset/0001.png",
    "name": "0001",
    "text": "anything1"
  },
  {
    "filepath": "dataset/0002.png",
    "name": "0002",
    "text": "anything1"
  },
  {
    "filepath": "dataset/0003.png",
    "name": "0003",
    "text": ""
  },
  {
    "filepath": "dataset/0004.png",
    "name": "0004",
    "text": ""
  },
  {
    "filepath": "dataset/0005.png",
    "name": "0005",
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

## Train

### Data preparation

#### Manual way

This command creates .html file, that is a website that helps label lines of texts on pngs.

```
    ketos transcribe -o output.html cropped/handwritten/0001.png cropped/handwritten/0002.png ...
```

This command unpacks informations to "dane_treningowe" directory.

```
    ketos extract -o training_data output.html
```

#### Automatic way

Firstly, you have to copy new-line sensitive text to input/dataset.json.

This creates .seg file that contains the localizations of bboxes with text. Its later used in create_train_data to label lines for training.

```
    kraken -i cropped/handwritten/0001.png 0001.seg segment
```

And then run python file create_train_data.py. It will use text from input/dataset.json and .seg file to prepere data.

### Training

This command train model with data

```
    ketos train -i ~/.config/kraken/ManuMcFondue.mlmodel --quit 30 --output models/ training_data/*.png
```

### Cleaning

Clear out obsolete data

```
    rm models/model_[0-9]*.mlmodel
```