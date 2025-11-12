import json
import time
from pathlib import Path

from image_cropper import handle_record as crop_record
from json_to_page import handle_record as generate_xml

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = (SCRIPT_DIR / "data").resolve()
JSON_PATH = (SCRIPT_DIR / "input" / "dataset.json").resolve()


def clear_n_lines(n):
    for _ in range(n):
        print("\033[F\033[K", end="")


def main():
    start_time = time.time()
    with open(JSON_PATH, encoding="utf-8") as f:
        json_data = json.load(f)
    i = 0
    for record in json_data:
        print(f"Processing: {record['name']} ({i + 1}/{len(json_data)})")
        print(" - Cropping image...")
        crop_record(record)
        print(" - Generating XML...")
        generate_xml(record)
        clear_n_lines(3)
        i += 1

        # audit - future work, maybe

    total_time = time.time() - start_time
    print(f"Preprocessing done in {total_time:.2f} seconds.")


if __name__ == "__main__":
    main()
