#!/bin/bash

FILEPATH="input/dataset.json"

echo $FILEPATH > temp.txt

python3 utils/cropp_dataset_images.py < temp.txt

echo "Cropping dataset done."

./scripts/create_seg_files.sh

echo "Creating .seg files done."

python3 utils/create_train_data.py < temp.txt

echo "Creating training data done."

rm temp.txt