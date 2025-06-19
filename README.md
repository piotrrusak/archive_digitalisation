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

---

## Train

### Data inputing

#### Manual way

This command creates .html file, that is a website that helps label lines of texts on pngs.

```
    ketos transcribe -o output.html cropped/handwritten/0001.png cropped/handwritten/0002.png ...
```

This command unpacks informations to "dane_treningowe" directory.

```
    ketos extract -o training_data output.html
```

#### Imo better way

Copy new-line sensitive text to input/dataset.json.

### Training data preparation

#### Semi-automatic way

Firstly, we need to crop and preprocess data so we have to execute:

```bash
    "input/dataset.json" > temp.txt
    python3 utils/cropp_dataset_images.py < temp.txt
    rm temp.txt
```

Then we have to segment data into lines, by executing:

```bash
    ./scripts/create_seg_files.sh
```

This command segments all of data cropped by previous command.

Then we have to prepere data in format of pair of files: line.png and line.txt:

```bash
    "input/dataset.json" > temp.txt
    python3 utils/create_train_data.py < temp.txt
    rm temp.txt
```

#### Automatic way

```bash
    ./scripts/create_train_data.sh
```

### Training

This command train model with data

```bash
    ketos train -i models/ManuMcFondue.mlmodel --output models/ --partition 0.5 --lag 30 training_data/*.png
```

"-i models/ManuMcFondue.mlmodel" - ustawienie modelu który będziemy fine-tunować a raczej ścieżki do niego
"--partition 0.5" - ustawienie proporcji test/train data
"--lag 30" - ustawienie ilości stage bez poprawy w mechaniźmie early stopping

### Cleaning

Clear out obsolete data

```bash
    ./scripts/clear_obsolete_data.sh
``` 

---

## Localisation detection

```
    {"type": "bbox", "imagename": null, "text_direction": "horizontal-lr", "script_detection": false,
    "lines": [
    {"id": "ae1f8f87-5854-450a-b542-fec2e0d038fa", "bbox": [407, 45, 2069, 131], "text": null, "base_dir": null, "type": "bbox", "imagename": null, "tags": null, "split": null, "regions": null, "text_direction": "horizontal-lr"},
    {"id": "cfd82a13-288c-4755-9977-d4b96779919c", "bbox": [392, 232, 2245, 337], "text": null, "base_dir": null, "type": "bbox", "imagename": null, "tags": null, "split": null, "regions": null, "text_direction": "horizontal-lr"},
    {"id": "59b280e1-bd26-41f9-99b1-09598eff20c5", "bbox": [406, 406, 2394, 511], "text": null, "base_dir": null, "type": "bbox", "imagename": null, "tags": null, "split": null, "regions": null, "text_direction": "horizontal-lr"},
    {"id": "bb855240-20bd-4508-8c5b-f47e9ed36a17", "bbox": [427, 588, 2313, 657], "text": null, "base_dir": null, "type": "bbox", "imagename": null, "tags": null, "split": null, "regions": null, "text_direction": "horizontal-lr"},
    {"id": "0340e01c-5214-40e4-9752-ae3909ed5565", "bbox": [392, 774, 2225, 867], "text": null, "base_dir": null, "type": "bbox", "imagename": null, "tags": null, "split": null, "regions": null, "text_direction": "horizontal-lr"},
    {"id": "41e9c4f3-2264-4d1d-8459-b1b1055db8b5", "bbox": [376, 942, 2232, 1030], "text": null, "base_dir": null, "type": "bbox", "imagename": null, "tags": null, "split": null, "regions": null, "text_direction": "horizontal-lr"},
    {"id": "3a01780a-f762-4fcc-a76c-1c3aa856dfe8", "bbox": [360, 1123, 2413, 1209], "text": null, "base_dir": null, "type": "bbox", "imagename": null, "tags": null, "split": null, "regions": null, "text_direction": "horizontal-lr"}
    ]
    , "regions": {}, "line_orders": []}
```

As you can see, every line has its bbox. Its boundaries are listed in .seg file if format: [LX, UY, RX, LY]. It doesn't detect bigger blocks of text, so if we want to combine lines, additional algorithm is needed.

## Useful commands

This creates .seg file that contains the localizations of bboxes with text. Its later used in create_train_data to label lines for training.

```
    kraken -i cropped/handwritten/0001.png seg/0001.seg segment
```

## Conclusion

We need a lot of data to train, but it has huge a potential.