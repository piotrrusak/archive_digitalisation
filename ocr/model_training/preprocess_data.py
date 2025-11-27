import json
import time
from pathlib import Path

from image_cropper import handle_record as crop_record
from json_to_page import handle_record as generate_xml
from augment_data import handle_record as augment_record

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = (SCRIPT_DIR / "data").resolve()
JSON_PATH = (SCRIPT_DIR / "input" / "dataset.json").resolve()


def clear_n_lines(n):
    for i in range(n):
        print("\033[F\033[K", end="")
        time.sleep((((2*i)/(n*(n+1))) * 0.2))


def main():
    start_time = time.time()
    with open(JSON_PATH, encoding="utf-8") as f:
        org_data_len = len(json.load(f))
    i = 0
    n = 0
    while True:
        clear_n_lines(n)
        n = 0
        with open(JSON_PATH, encoding="utf-8") as f:
            json_data = json.load(f)
            print(f"Dataset size: {len(json_data)} records.")
            n += 1
        try :
            record = json_data[i]
        except IndexError:
            break
        print(f"Processing: {record['name']} ({i + 1}/{len(json_data)})")
        n += 1
        if i < org_data_len:
            print(" - Augmenting record...")
            n += augment_record(record) + 1

        print(" - Cropping image...")
        n += crop_record(record) + 1
        print(" - Generating XML...")
        n += generate_xml(record) + 1
        i += 1

        # audit - future work, maybe
    total_time = time.time() - start_time
    clear_n_lines(n)
    print(f"Preprocessing done in {total_time:.2f} seconds.")


if __name__ == "__main__":
    main()
