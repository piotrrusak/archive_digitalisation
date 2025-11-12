import subprocess
from pathlib import Path

from preprocess_data import main as preprocess_data
from train_segmentator import main as train_segmentator

SCRIPT_DIR = Path(__file__).resolve().parent


def main():
    print("Loading backups...")
    subprocess.run(["./load_backups.sh"], cwd=SCRIPT_DIR)
    print("Preprocessing data...")
    preprocess_data()
    print("Training segmentator model...")
    train_segmentator()


if __name__ == "__main__":
    main()
