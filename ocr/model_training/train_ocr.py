from __future__ import annotations
import glob, random, re, json, shutil, datetime
from pathlib import Path
from typing import Optional, List, Tuple

import torch

from kraken.lib.train import RecognitionModel, KrakenTrainer

from utils.memory_info import main as print_memory_info

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR   = (SCRIPT_DIR / "data").resolve()
OUT_DIR    = (SCRIPT_DIR / "train_runs").resolve()
OUT_DIR.mkdir(parents=True, exist_ok=True)

MIN_EPOCHS = 5
MAX_EPOCHS = 200
SEED       = 42

BEST_OCR_PATH = (SCRIPT_DIR / ".." / "models" / "ocr_best.mlmodel").resolve()


def _natural_epoch_sort_key(p: Path) -> int:
    m = re.search(r"model_(\d+)\.mlmodel$", p.name)
    return int(m.group(1)) if m else -1


def _load_metric_sibling(model_path: Path) -> Optional[Tuple[str, float, bool]]:
    for suf in (".json", ".metrics.json", ".report.json"):
        p = model_path.with_suffix(suf)
        if p.exists():
            try:
                with p.open("r", encoding="utf-8") as f:
                    data = json.load(f)

                candidates: List[Tuple[str, float, bool]] = []
                def add_if_num(key: str, higher_is_better: bool):
                    v = data.get(key, None)
                    if isinstance(v, (int, float)):
                        candidates.append((key, float(v), higher_is_better))

                add_if_num("val_cer", False)
                add_if_num("cer", False)
                add_if_num("val_loss", False)
                add_if_num("loss", False)

                add_if_num("val_accuracy", True)
                add_if_num("accuracy", True)

                if candidates:
                    group_false = [c for c in candidates if c[2] is False]
                    if group_false:
                        key, val, tr = min(group_false, key=lambda t: t[1])
                        return (key, val, tr)
                    else:
                        key, val, tr = max(candidates, key=lambda t: t[1])
                        return (key, val, tr)

            except Exception:
                pass
    return None


def _debug_dump_gt_lines(model: RecognitionModel, run_dir: Path, n: int = 5) -> None:
    try:
        dl = model._make_dataloader(split="train", shuffle=False)
        batch = next(iter(dl))
        targets = None
        if isinstance(batch, dict):
            targets = batch.get("y", None) or batch.get("targets", None)
        if targets is None and isinstance(batch, (list, tuple)) and len(batch) >= 2:
            targets = batch[1]

        if targets is not None:
            lines = []
            for i, t in enumerate(targets):
                if i >= n:
                    break
                if isinstance(t, str):
                    lines.append(t)
                else:
                    try:
                        lines.append(str(t))
                    except Exception:
                        lines.append("<unprintable target>")
            if lines:
                with (run_dir / "_debug_gt_lines.txt").open("w", encoding="utf-8") as f:
                    for i, l in enumerate(lines):
                        f.write(f"[{i}] {l}\n")
                print(f"[debug] Zapisano przykładowe GT linie do {run_dir / '_debug_gt_lines.txt'}")
        else:
            print("[debug] Nie udało się odczytać targetów z batcha (format inny niż oczekiwany).")
    except Exception as e:
        print(f"[debug] Failed to dump GT lines: {e}")


def train(
    data_dir: Path = DATA_DIR,
    out_root: Path = OUT_DIR,
    min_epochs: int = MIN_EPOCHS,
    max_epochs: int = MAX_EPOCHS,
    seed: int = SEED,
    overfit_one: bool = False,
) -> Path:
    all_xml = sorted(glob.glob(str((data_dir).resolve() / "*.xml")))
    assert all_xml, f"Nie znaleziono plików XML w {data_dir}"

    random.seed(seed)
    random.shuffle(all_xml)

    split = max(1, int(0.1 * len(all_xml)))
    val_xml   = all_xml[:split]
    train_xml = all_xml[split:]
    if overfit_one:
        val_xml = train_xml[:]

    print(f"train: {len(train_xml)}  |  val: {len(val_xml)}")

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    run_dir = (out_root / f"ocr_{timestamp}").resolve()
    run_dir.mkdir(parents=True, exist_ok=True)

    model = RecognitionModel(
        training_data   = train_xml,
        evaluation_data = val_xml,
        format_type     = "xml",
        output          = str(run_dir / "model"),
        num_workers     = 4,
    )

    trainer = KrakenTrainer(
        default_root_dir   = str(run_dir),
        min_epochs         = min_epochs,
        max_epochs         = max_epochs,
        enable_progress_bar= True,
        precision          = "bf16-mixed" if torch.cuda.is_available() else 32,
        limit_val_batches  = 1,
        log_every_n_steps  = 1,
        earyly_stopping_patience = 10**9,
    )

    if torch.cuda.is_available():
        torch.set_float32_matmul_precision("high")
        torch.backends.cudnn.benchmark = True
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True

    _debug_dump_gt_lines(model, run_dir)

    print("== Start training OCR ==")
    trainer.fit(model)
    print("== Finished training OCR ==")

    print("Finished training, check:", run_dir)
    return run_dir


def promote(
    run_dir: Path,
    dest_path: Path,
) -> Tuple[Path, Optional[Tuple[str, float, bool]]]:
    run_dir   = Path(run_dir).resolve()
    dest_path = Path(dest_path).resolve()
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    candidates = sorted(run_dir.glob("model_*.mlmodel"), key=_natural_epoch_sort_key)
    if not candidates:
        raise FileNotFoundError(f"Brak plików model_*.mlmodel w {run_dir}")

    scored: List[Tuple[Path, Tuple[str, float, bool]]] = []
    for m in candidates:
        met = _load_metric_sibling(m)
        if met is not None:
            scored.append((m, met))

    if scored:
        smaller_better = [x for x in scored if x[1][2] is False]
        if smaller_better:
            selected, best_metric = min(smaller_better, key=lambda x: x[1][1])
        else:
            selected, best_metric = max(scored, key=lambda x: x[1][1])
    else:
        selected = max(candidates, key=_natural_epoch_sort_key)
        best_metric = None

    shutil.copy2(selected, dest_path)
    print(f"Promoted: {selected.name}  →  {dest_path}  (metric={best_metric})")
    return selected, best_metric


def main():
    print_memory_info()
    run_dir = train(
        data_dir   = DATA_DIR,
        out_root   = OUT_DIR,
        min_epochs = MIN_EPOCHS,
        max_epochs = MAX_EPOCHS,
        overfit_one= False,
    )
    promote(run_dir, BEST_OCR_PATH)


if __name__ == "__main__":
    main()
