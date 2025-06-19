import sys

from PIL import Image
import json

def create_train_data(json_path):

    with open(json_path) as f:
        dataset = json.load(f)

    for element in dataset:
        if element["text"] == "":
            continue

        name = element["name"]

        image = Image.open("cropped/handwritten/" + element["name"] + ".png")

        with open("seg/" + name + ".seg", "r", encoding="utf-8") as f:
            seg = json.load(f)

        lines = element["text"].splitlines()

        for i, (line, trans) in enumerate(zip(seg["lines"], lines), start=1):
            box = line["bbox"]
            region = image.crop(box)
            base = f"{name}_{i:04}"
            region.save(f"training_data/{base}.png")
            with open(f"training_data/{base}.gt.txt", "w", encoding="utf-8") as f:
                f.write(trans)

if __name__ == "__main__":
    filepath = sys.stdin.read()[0:-1]
    create_train_data(filepath)