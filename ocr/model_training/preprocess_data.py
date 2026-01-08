import json
import time
from pathlib import Path
import subprocess

from augment_data import handle_record as augment_record
from image_cropper import handle_record as crop_record
from json_to_page import handle_record as generate_xml

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = (SCRIPT_DIR / "data").resolve()
JSON_PATH = (SCRIPT_DIR / "input" / "dataset.json").resolve()



def clear_n_lines(number_of_lines):
    for i in range(number_of_lines):
        print("\033[F\033[K", end="")
        time.sleep(((2*i)/(number_of_lines*(number_of_lines+1))) * 0.2)


def main():
    start_time = time.time()

    subprocess.run(["./load_backups.sh"], cwd = str(SCRIPT_DIR), check=True)
    
    with open(JSON_PATH, encoding="utf-8") as f:
        original_data = json.load(f)
    original_data.sort(key=lambda x: int(x["name"]))
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(original_data, f, ensure_ascii=False, indent=4)

    record_index = 0
    lines_printed = 0

    json_data = []
    reload_json_data = True

    while True:
        clear_n_lines(lines_printed)
        lines_printed = 0
        if reload_json_data:
            print("Reloading JSON data...")
            lines_printed += 1
            with open(JSON_PATH, encoding="utf-8") as f:
                json_data = json.load(f)
        
        try :
            record = json_data[record_index]
        except IndexError:
            break

        print(f"Processing: {record['name']} ({record_index + 1}/{len(json_data)})")
        lines_printed += 1
        reload_json_data = False
        if "aug" not in record["name"]:
            print(" - Augmenting record...")
            lines_printed += augment_record(record) + 1
            reload_json_data = True

        print(" - Cropping image...")
        lines_printed += crop_record(record) + 1
        print(" - Generating XML...")
        lines_printed += generate_xml(record) + 1
        record_index += 1

        # audit - future work, maybe
    total_time = time.time() - start_time
    clear_n_lines(lines_printed)
    print(f"Preprocessing done in {total_time:.2f} seconds.")


if __name__ == "__main__":
    main()
