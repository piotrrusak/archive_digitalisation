from __future__ import annotations

import datetime
import glob
import json
import random
import re
import shutil
from pathlib import Path

import torch
from kraken.lib.train import KrakenTrainer, SegmentationModel
from PIL import Image
from utils.memory_info import main as print_memory_info

print_memory_info()

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = (SCRIPT_DIR / "data").resolve()
OUT_DIR = (SCRIPT_DIR / "train_runs").resolve()
OUT_DIR.mkdir(parents=True, exist_ok=True)

MIN_EPOCHS = 5
MAX_EPOCHS = 55
SEED = 42


def _natural_epoch_sort_key(p):
    m = re.search(r"model_(\d+)\.mlmodel$", p.name)
    return int(m.group(1)) if m else -1


def _load_metric_sibling(model_path):
    for suf in (".json", ".metrics.json", ".report.json"):
        p = model_path.with_suffix(suf)
        if p.exists():
            try:
                with p.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                for key in ("val_freq_iu", "freq_iu", "val_mean_iu", "mean_iu"):
                    if key in data and isinstance(data[key], (int, float)):
                        return float(data[key])
            except Exception:
                pass
    return None


def _debug_dump_gt(model, run_dir):
    try:
        dl = model._make_dataloader(split="train", shuffle=False)
        xb, yb = next(iter(dl))
        gt = yb.argmax(1)[0].cpu().numpy()
        Image.fromarray((gt > 0).astype("uint8") * 255).save(run_dir / "_debug_gt.png")
        print(f"[debug] GT sum (first sample): {gt.sum()}")
    except Exception as e:
        print(f"[debug] Failed to dump GT: {e}")


def train(
    data_dir=DATA_DIR,
    out_root=OUT_DIR,
    min_epochs=MIN_EPOCHS,
    max_epochs=MAX_EPOCHS,
    seed=SEED,
    overfit_one=False,
):
    all_xml = sorted(glob.glob(str((data_dir).resolve() / "*.xml")))
    assert all_xml, f"No XML files found in {data_dir}"
    random.seed(seed)
    random.shuffle(all_xml)

    split = max(1, int(0.1 * len(all_xml)))
    val_xml = all_xml[:split]
    train_xml = all_xml[split:]
    if overfit_one:
        val_xml = train_xml[:]

    print(f"train: {len(train_xml)}  |  val: {len(val_xml)}")

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    run_dir = (out_root / f"seg_{timestamp}").resolve()
    run_dir.mkdir(parents=True, exist_ok=True)

    SEG_SPEC = "[1,900,0,3 Cr7,7,32,2,2 Gn16 Cr3,3,64,2,2 Gn16 Cr3,3,64 Gn16 Cr3,3,128 Gn16]"

    model = SegmentationModel(
        training_data=train_xml,
        evaluation_data=val_xml,
        format_type="xml",
        output=str(run_dir / "model"),
        spec=SEG_SPEC,
        num_workers=4,
    )

    trainer = KrakenTrainer(
        default_root_dir=str(run_dir),
        min_epochs=min_epochs,
        max_epochs=max_epochs,
        enable_progress_bar=True,
        precision="bf16-mixed" if torch.cuda.is_available() else 32,
        limit_val_batches=1,
        log_every_n_steps=1,
    )

    if torch.cuda.is_available():
        torch.set_float32_matmul_precision("high")

    _debug_dump_gt(model, run_dir)

    trainer.fit(model)

    print("Finished training, check:", run_dir)
    return run_dir


def promote(run_dir, dest_path, prefer_metric=True):
    run_dir = Path(run_dir).resolve()
    dest_path = Path(dest_path).resolve()
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    candidates = sorted(run_dir.glob("model_*.mlmodel"), key=_natural_epoch_sort_key)
    if not candidates:
        raise FileNotFoundError(f"No model_*.mlmodel files found in {run_dir}")

    selected = None
    best_metric = None

    if prefer_metric:
        scored = []
        for m in candidates:
            sc = _load_metric_sibling(m)
            if sc is not None:
                scored.append((m, sc))
        if scored:
            scored.sort(key=lambda x: x[1], reverse=True)
            selected, best_metric = scored[0]
        else:
            selected = max(candidates, key=_natural_epoch_sort_key)
    else:
        selected = max(candidates, key=_natural_epoch_sort_key)

    shutil.copy2(selected, dest_path)
    print(f"Promoted: {selected.name}  →  {dest_path}  (metric={best_metric})")
    return selected, best_metric


def main():
    print_memory_info()
    run_dir = train(
        data_dir=DATA_DIR,
        out_root=OUT_DIR,
        min_epochs=MIN_EPOCHS,
        max_epochs=MAX_EPOCHS,
        overfit_one=False,
    )
    BEST_PATH = (SCRIPT_DIR / ".." / "models" / "seg_best.mlmodel").resolve()
    promote(run_dir, BEST_PATH, prefer_metric=True)


if __name__ == "__main__":
    main()
