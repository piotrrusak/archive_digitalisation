#!/bin/bash

mkdir -p ../seg

for file in cropped/handwritten/*.png; do
    name=$(basename "$file" .png)
    kraken -i "$file" "../seg/${name}.seg" segment
done