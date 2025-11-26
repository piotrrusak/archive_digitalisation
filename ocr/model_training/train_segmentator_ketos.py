from __future__ import annotations

import datetime
import glob
import random
import re
import shutil
import subprocess
from pathlib import Path

from utils.memory_info import main as print_memory_info

SCRIPT_DIR = Path(__file__).resolve().parent

DATA_DIR = (SCRIPT_DIR / "data").resolve()

OUT_DIR = (SCRIPT_DIR / "train_runs").resolve()
OUT_DIR.mkdir(parents=True, exist_ok=True)

BEST_MODEL_PATH = (SCRIPT_DIR / ".." / "models" / "seg_best.mlmodel").resolve()

FORMAT_TYPE = "page"

BASE_MODEL = (SCRIPT_DIR / ".." / "models" / "blla.mlmodel").resolve()
# BASE_MODEL = None

MIN_EPOCHS = 30
MAX_EPOCHS = 100
LAG = 10
SEED = 42
VAL_RATIO = 0.2
DEVICE = "cuda:0"

SCHEDULE = "cosine"

WORKERS = 8
USE_AUGMENT = True


def natural_epoch_sort_key(p):
    m = re.search(r"model_(\d+)\.mlmodel$", p.name)
    return int(m.group(1)) if m else -1


def promote(run_dir, dest_path):
    run_dir = Path(run_dir).resolve()
    dest_path = Path(dest_path).resolve()
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    best_path = run_dir / "model_best.mlmodel"
    if not best_path.exists():
        print(f"{best_path} not found - taking latest model instead")
        model_paths = sorted(
            run_dir.glob("model_*.mlmodel"),
            key=natural_epoch_sort_key,
            reverse=True,
        )
        if not model_paths:
            raise FileNotFoundError(f"No model_*.mlmodel files found in {run_dir}")
        best_path = model_paths[0]

    shutil.copy2(best_path, dest_path)
    print(f"Promoted segmenter: {best_path.name}  →  {dest_path}")
    return best_path


def collect_xml_files(data_dir):
    xml_paths = sorted(glob.glob(str(data_dir / "*.xml")))
    if not xml_paths:
        raise FileNotFoundError(f"No XML files found in {data_dir}")
    return [Path(p) for p in xml_paths]


def train_val_split(xml_files, seed=SEED, val_ratio=VAL_RATIO):
    xml_files = list(xml_files)
    random.seed(seed)
    random.shuffle(xml_files)

    split_idx = max(1, int(len(xml_files) * val_ratio))
    val_xml = xml_files[:split_idx]
    train_xml = xml_files[split_idx:]

    if not train_xml:
        raise RuntimeError("Train split is empty – too high VAL_RATIO for this dataset")

    return train_xml, val_xml


def write_manifest(paths, dest):
    dest = dest.resolve()
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w", encoding="utf-8") as f:
        for p in paths:
            f.write(str(p) + "\n")
    return dest


def run_ketos_segtrain(
    data_dir=DATA_DIR,
    out_root=OUT_DIR,
    format_type=FORMAT_TYPE,
    base_model=BASE_MODEL,
    min_epochs=MIN_EPOCHS,
    max_epochs=MAX_EPOCHS,
    lag=LAG,
    device=DEVICE,
    val_ratio=VAL_RATIO,
    schedule=SCHEDULE,
    workers=WORKERS,
    use_augment=USE_AUGMENT,
):
    data_dir = Path(data_dir).resolve()
    out_root = Path(out_root).resolve()

    xml_files = collect_xml_files(data_dir)
    print(f"Found {len(xml_files)} XML files in {data_dir}")
    train_xml, val_xml = train_val_split(xml_files, val_ratio=val_ratio)
    print(f"train: {len(train_xml)}  |  val: {len(val_xml)}")

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    run_dir = (out_root / f"seg_{timestamp}").resolve()
    run_dir.mkdir(parents=True, exist_ok=True)

    train_manifest = write_manifest(train_xml, run_dir / "train.txt")
    val_manifest = write_manifest(val_xml, run_dir / "val.txt")

    cmd = [
        "ketos",
        "segtrain",
        "-f",
        format_type,
        "--device",
        device,
        "--workers",
        str(workers),
        "--min-epochs",
        str(min_epochs),
        "-N",
        str(max_epochs),
        "--lag",
        str(lag),
        "-q",
        "early",
        "--schedule",
        schedule,
        "--output",
        str(run_dir / "model"),
        "-t",
        str(train_manifest),
        "-e",
        str(val_manifest),
    ]

    if use_augment:
        cmd.append("--augment")

    if base_model is not None:
        base_model_path = Path(base_model).resolve()
        if not base_model_path.exists():
            raise FileNotFoundError(f"Base segmentation model not found: {base_model_path}")
        cmd += ["-i", str(base_model_path), "--resize", "both"]

    print("Running ketos segtrain:")
    print("  " + " ".join(cmd))

    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("Segmentation training interrupted by user")
        return run_dir

    print(f"Finished ketos segtrain, run dir: {run_dir}")
    return run_dir


def main():
    print_memory_info()

    run_dir = run_ketos_segtrain(
        data_dir=DATA_DIR,
        out_root=OUT_DIR,
        format_type=FORMAT_TYPE,
        base_model=BASE_MODEL,
        min_epochs=MIN_EPOCHS,
        max_epochs=MAX_EPOCHS,
        lag=LAG,
        device=DEVICE,
        val_ratio=VAL_RATIO,
        schedule=SCHEDULE,
        workers=WORKERS,
        use_augment=USE_AUGMENT,
    )

    promote(run_dir, BEST_MODEL_PATH)


if __name__ == "__main__":
    main()
