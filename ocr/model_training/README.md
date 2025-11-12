# How to use script to generate data

in line 13 of file gen_data.py specify direct path to IAM dataset files

or, alternatively You can just paste it into model_training directory into a directory named `dataset`

```
model_training
├── dataset
    ├── 000
    ├── 001
    ├── ...
    └── 671
```

just run the gen_data script

```bash
python "ocr/model_training/gen_data.py"
```