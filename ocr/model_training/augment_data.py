import json
import os
from pathlib import Path

import numpy as np
from PIL import Image

masks_per_image = 10

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


with open(os.path.join(JSON_DIR, "dataset.json")) as f:
    json_data = json.load(f)

next_record_num = int(max(json_data, key=lambda x: int(x["name"]), default={"name": -1})["name"]) + 1

old_data = json_data.copy()

for record in old_data:
    record = json_data[0]

    n = len(record["lines"])

    image_file = os.path.join(SCRIPT_DIR, record["filepath"])

    with Image.open(image_file) as im:
        im_arr = np.array(im)

    for mask in iterate_through_masks(n):
        if len(mask) == 0 or len(mask) == n:
            continue

        if np.random.rand() > (masks_per_image / (2**n)):
            continue

        mask.sort()
        lineset = [record["lines"][i] for i in mask]
        image_copy = np.random.randint(250, 255, size=im_arr.shape, dtype=np.int16).astype(np.uint8)
        for line in lineset:
            bbox = line["bbox"]
            image_copy[bbox[1] : bbox[3], bbox[0] : bbox[2]] = im_arr[bbox[1] : bbox[3], bbox[0] : bbox[2]]
        name = f"{next_record_num:04d}.png"
        new_dataset_entry = {
            "name": name.split(".")[0],
            "filepath": f"data/{name}",
            "lines": lineset,
        }

        out_im = Image.fromarray(image_copy)
        out_path = Path(DATA_DIR) / name
        out_im.save(out_path)

        json_data.append(new_dataset_entry)
        next_record_num += 1

print(f"Total records after augmentation: {len(json_data)}")

with open(os.path.join(JSON_DIR, "dataset.json"), "w", encoding="utf-8") as f:
    json.dump(json_data, f, ensure_ascii=False, indent=4)
