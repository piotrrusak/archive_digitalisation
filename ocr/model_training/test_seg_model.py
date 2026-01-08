from __future__ import annotations

import json
import multiprocessing as mp
from collections.abc import Callable
from dataclasses import dataclass
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from types import ModuleType

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class SegModelSpec:
    name: str
    path: Path
    handler_path: Path
    description: str = ""


SCRIPT_DIR = Path(__file__).resolve().parent
JSON_PATH = SCRIPT_DIR / "input" / "dataset.json"

OUT_FILE = SCRIPT_DIR / "test_results" / "segmentation_test_results_new.json"
SAVED_DATA = {}

def load_module_from_path(path: Path) -> ModuleType:
    unique_name = f"_seg_model_{path.stem}_{abs(hash(path.as_posix()))}"
    spec = spec_from_file_location(unique_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot create spec for {path}")
    module = module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as err:
        raise ImportError(f"Error while importing {path}") from err
    return module


def load_dataset(json_path: Path = JSON_PATH):
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def segmentation_metric(gt_lines, pred_lines, image):
    h, w = image.size[1], image.size[0]
    gt_mask = np.zeros((h, w), dtype=np.uint8)
    pred_mask = np.zeros((h, w), dtype=np.uint8)

    for line in gt_lines:
        x1, y1, x2, y2 = line["bbox"]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        if x2 > x1 and y2 > y1:
            gt_mask[y1:y2, x1:x2] = 1

    for line in pred_lines:
        x1, y1, x2, y2 = line["bbox"]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        if x2 > x1 and y2 > y1:
            pred_mask[y1:y2, x1:x2] = 1

    inter = np.logical_and(gt_mask, pred_mask).sum()
    gt_sum = gt_mask.sum()
    pred_sum = pred_mask.sum()

    if gt_sum == 0 and pred_sum == 0:
        return 1.0
    if gt_sum == 0 and pred_sum > 0:
        return 0.0
    if gt_sum > 0 and pred_sum == 0:
        return 0.0
    if inter == 0:
        return 0.0

    recall = inter / gt_sum
    precision = inter / pred_sum

    return recall * precision


def _get_segment_function(handler_module: ModuleType) -> Callable:
    if hasattr(handler_module, "segment"):
        return handler_module.segment
    if hasattr(handler_module, "handle"):
        return handler_module.handle
    raise AttributeError("Handler module must define a 'segment(image, ...)' or 'handle(image, ...)' function.")


def _load_seg_model_in_handler(handler_module: ModuleType, model_path: Path) -> None:
    if hasattr(handler_module, "load"):
        handler_module.load(model_path)
        return

    if hasattr(handler_module, "MODEL_PATH"):
        handler_module.MODEL_PATH = model_path
        return

    raise AttributeError("Handler module must define 'load(model_path)' or expose 'MODEL_PATH' attribute.")


def test_seg_model(
    model_path: Path,
    handler_path: Path,
    max_pages: int | None = None,
    concurrently: bool = False,
    dataset=None,
) :
    handler_module = load_module_from_path(handler_path)
    _load_seg_model_in_handler(handler_module, model_path)
    segment_func = _get_segment_function(handler_module)

    if dataset is None :
        dataset = load_dataset(JSON_PATH)

    if not concurrently :
        input(f"Press Enter to start testing segmentator {model_path.name}...")
        print(f"Testing segmentator {model_path.name} (Ctrl+C to stop)")

    total_score = 0.0
    page_count = 0
    log_length = 0

    for item in dataset :
        img_path = SCRIPT_DIR / item["filepath"]
        image = Image.open(img_path).convert("RGB")

        pred_lines = segment_func(image, seg_model_path=model_path, filter_warnings=True)
        gt_lines = item["lines"]

        page_score = segmentation_metric(gt_lines, pred_lines, image)
        total_score += page_score
        page_count += 1

        avg_score = total_score / page_count
        log = f"   Page {page_count}, current model score: {avg_score:.4f}"
        log_length = max(log_length, len(log))

        if not concurrently :
            print(log + " " * max((log_length - len(log), 0)), end="\r")
        else :
            yield (page_score, avg_score)

        if max_pages is not None and page_count >= max_pages :
            break

    if not concurrently :
        print(" " * log_length, end="\r")
        print(f"After {page_count} pages")
        print(log)
    else :
        yield None



def _run_seg_model_in_process(model_path, handler_path, max_pages, queue, model_name) :
    for payload in test_seg_model(model_path, handler_path, max_pages, concurrently=True) :
        queue.put((model_name, payload))
    queue.put((model_name, None))



def test_seg_models_concurrently(
    model_specs,
    pages_per_model: int | None = None,
    one_line: bool = True,
) :
    global SAVED_DATA
    normalized = [(Path(m), Path(h)) for (m, h) in model_specs]
    normalized.sort(key=lambda p: len(p[0].name), reverse=True)

    SAVED_DATA = { model_path.name : [] for (model_path, _) in normalized }

    column_length = len(normalized[0][0].name) if normalized else 10

    dataset = load_dataset(JSON_PATH)
    dataset_length = len(dataset)
    if pages_per_model is None or pages_per_model > dataset_length:
        pages_per_model = dataset_length

    print("Starting concurrent segmentator tests...")
    frontline = " " * 6
    header = frontline
    for model_path, _ in normalized:
        name = model_path.name
        if len(name) % 2 == 1:
            name += " "
        header += (
            "| " + " " * ((column_length - len(name)) // 2) + name + " " * ((column_length - len(name)) // 2) + " "
        )
    print(header + "|")
    print(frontline + "-" * (len(header) + 1 - len(frontline)))

    queues = [mp.Queue() for _ in normalized]

    processes = []
    for (model_path, handler_path), queue in zip(normalized, queues, strict=False):
        p = mp.Process(
            target=_run_seg_model_in_process,
            args=(model_path, handler_path, pages_per_model, queue, model_path.name),
        )
        p.start()
        processes.append(p)

    prev_results = [0.0] * len(normalized)
    finished = [False] * len(normalized)
    iteration = 0

    while not all(finished):
        row = []
        for i, queue in enumerate(queues):
            if finished[i]:
                row.append(prev_results[i])
                continue

            msg_model, payload = queue.get()

            if payload is None:
                finished[i] = True
                row.append(prev_results[i])
            else:
                page_score, avg_score = payload
                SAVED_DATA[msg_model].append(page_score)

                prev_results[i] = avg_score
                row.append(avg_score)


        iteration += 1
        line = frontline
        for value in row:
            result_str = f"{value:.4f}"
            line += (
                "| "
                + " " * ((column_length - len(result_str)) // 2)
                + result_str
                + " " * ((column_length - len(result_str)) // 2)
                + " "
            )
        print(line + f"| {iteration} / {pages_per_model + 1}", end="\r" if one_line else "\n")

    for p in processes:
        p.join()
    if one_line:
        print(line + f"| {iteration} / {pages_per_model + 1}")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(SAVED_DATA, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    SEG_HANDLER_PATH = SCRIPT_DIR / ".." / "app" / "segmentator.py"

    test_seg_models_concurrently(
        [
            (SCRIPT_DIR / ".." / "models" / "seg_best.mlmodel", SEG_HANDLER_PATH),
            (SCRIPT_DIR / ".." / "models" / "seg_best_submitted.mlmodel", SEG_HANDLER_PATH),
            (SCRIPT_DIR / ".." / "models" / "seg_best_old.mlmodel", SEG_HANDLER_PATH),
            (SCRIPT_DIR / ".." / "models" / "blla.mlmodel", SEG_HANDLER_PATH),
        ],
        pages_per_model=float('inf'),
        one_line=True,
    )
