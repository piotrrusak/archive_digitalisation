import json
import os
from pathlib import Path

import numpy as np
from PIL import Image

MASKS_PER_IMAGE = 15

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(SCRIPT_DIR, "input")
DATA_DIR = os.path.join(SCRIPT_DIR, "data")


def get_next(mask):
    prev = -1

    for i in range(len(mask) - 1, -2, -1):
        if i == -1 or mask[i] != prev + 1:
            mask[:] = mask[: i + 1] + [prev + 1]
            break
        prev = mask.pop()


def iterate_through_masks(n):
    mask = []
    while len(mask) <= n:
        yield mask.copy()
        if len(mask) == n:
            break
        get_next(mask)

def generate_maskset(n, num_of_masks=MASKS_PER_IMAGE):
    masks = [(mask, i) for i, mask in enumerate(iterate_through_masks(n)) if 0 < len(mask) < n]
    maskset = []
    for mask in masks :
        while len(maskset) <= (len(mask[0]) - 1):
            maskset.append([])
        maskset[len(mask[0]) - 1].append(mask)
        
    out_maskset = []
    masks_per_length = max(num_of_masks // (n - 1), 1)
    for lenset in maskset:
        np.random.shuffle(lenset)
        for mask in lenset[:masks_per_length]:
            out_maskset.append(mask)
        if len(out_maskset) >= num_of_masks:
            break
        
    out_maskset.sort(key=lambda x: x[1])
    
    out_maskset = [mask[0] for mask in out_maskset]
    
    return out_maskset

def handle_record(record):
    print(f"Augmenting record: {record['name']}")
    output = 1
    n = len(record["lines"])
    print(f" - {n} lines found.")
    output += 1
    
    image_file = os.path.join(SCRIPT_DIR, record["filepath"])
    with Image.open(image_file) as im:
        im_arr = np.array(im)

    mask_number = 0

    for mask in generate_maskset(n):

        print(f" - Creating augmented image with lines: {mask}")
        output += 1
        mask_number += 1

        lineset = [record["lines"][i] for i in mask]
        image_copy = np.random.randint(250, 255, size=im_arr.shape, dtype=np.int16).astype(np.uint8)
        for line in lineset:
            bbox = line["bbox"]
            image_copy[bbox[1] : bbox[3], bbox[0] : bbox[2]] = im_arr[bbox[1] : bbox[3], bbox[0] : bbox[2]]
        name = f"aug_{int(record['name']):04d}_{mask_number:04d}.png"
        new_dataset_entry = {
            "name": name.split(".")[0],
            "filepath": f"data/{name}",
            "lines": lineset,
        }

        out_im = Image.fromarray(image_copy)
        out_path = Path(DATA_DIR) / name
        out_im.save(out_path)


        # open json file and append new entry there
        json_path = Path(JSON_DIR) / "dataset.json"
        with json_path.open("r", encoding="utf-8") as f:
            json_data = json.load(f)
        json_data.append(new_dataset_entry)
        with json_path.open("w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False, indent=4)

    #return number of printed lines
    return output

if __name__ == "__main__":
    #test
    print(generate_maskset(17))
