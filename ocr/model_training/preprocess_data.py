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
        original_data = json.load(f)
    original_data.sort(key=lambda x: int(x["name"]))
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(original_data, f, ensure_ascii=False, indent=4)

    i = 0
    n = 0

    json_data = []
    reload_json_data = True

    while True:
        clear_n_lines(n)
        n = 0
        if reload_json_data:
            print("Reloading JSON data...")
            n += 1
            with open(JSON_PATH, encoding="utf-8") as f:
                json_data = json.load(f)
        
        try :
            record = json_data[i]
        except IndexError:
            break

        print(f"Processing: {record['name']} ({i + 1}/{len(json_data)})")
        n += 1
        reload_json_data = False
        if "aug" not in record["name"]:
            print(" - Augmenting record...")
            n += augment_record(record) + 1
            reload_json_data = True

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
