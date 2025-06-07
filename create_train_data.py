from PIL import Image
import json

def create_train_data():

    with open("input/dataset.json") as f:
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
            region.save(f"dane_treningowe/{base}.png")
            with open(f"dane_treningowe/{base}.gt.txt", "w", encoding="utf-8") as f:
                f.write(trans)

if __name__ == "__main__":
    create_train_data()