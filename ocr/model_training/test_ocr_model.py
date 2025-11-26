from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from types import ModuleType
import json
from PIL import Image
from rapidfuzz.distance import Levenshtein
import multiprocessing as mp

@dataclass(frozen=True)
class ModelSpec:
    name: str
    path: Path
    description: str
    handle: Callable


def load_module_from_path(path: Path) -> ModuleType:
    unique_name = f"_ocr_model_{path.stem}_{abs(hash(path.as_posix()))}"
    spec = spec_from_file_location(unique_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot create spec for {path}")
    module = module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as err:
        raise ImportError(f"Error while importing {path}") from err
    return module

MODEL_HANDLER_PATH = Path(__file__).resolve().parent / ".." / "models" / "ocr_models" / "handlers" / "kraken.py"
MODEL_PATH = Path(__file__).resolve().parent / ".." / "models" / "ocr_best_ketos.mlmodel"
JSON_PATH = Path(__file__).resolve().parent / "input" / "dataset.json"

def normalize_text(text) :
    return " ".join((text or "").split()).strip()

def load_dataset(json_path : Path = JSON_PATH) :
    with JSON_PATH.open("r", encoding="utf-8") as f :
        dataset_info = json.load(f)
    return dataset_info

def test_model(model_path = MODEL_PATH, model_handler = MODEL_HANDLER_PATH, tests = 100, concurrently = False, dataset_info = None) :
    module = load_module_from_path(model_handler)
    module.load(model_path)
    handle_func = module.handle
    if dataset_info is None :
        dataset_info = load_dataset(JSON_PATH)

    counter = 0
    score = 0
    log_length = 0

    if not concurrently :
        input(f"Press Enter to start testing model {model_path.name}...")
        print(f"Testing model {model_path.name} (Ctrl+C to stop)")

    for item in dataset_info :
        img = Image.open(Path(__file__).resolve().parent / item["filepath"])
        for line in item["lines"] :
            line_img = img.crop((line["bbox"][0], line["bbox"][1], line["bbox"][2], line["bbox"][3]))
            
            result = handle_func(line_img, filter_warnings = True)

            expected = normalize_text(line["text"])
            got = normalize_text(result)

            lev_distance = float(Levenshtein.distance(expected, got))
            score += 1 - (lev_distance / max(1, len(expected)))
            
            log = f"   Test {counter + 1}, current model score: {score / (counter + 1):.4f}"
            log_length = max(log_length, len(log))
            if not concurrently :
                print(log + " " * max((log_length - len(log), 0)), end = "\r")
            else :
                yield score / (counter + 1)

            counter += 1

            if counter >= tests : break
        
        if counter >= tests : break


    if not concurrently :
        print(" " * log_length, end = "\r")
        print(f"After {counter} tests")
        
        print(log)
    else :
        yield None


def _run_model_in_process(model_path, model_handler, tests, queue):
    for result in test_model(model_path, model_handler, tests, concurrently=True):
        queue.put(result)
    queue.put(None)


def test_models_concurrently(model_paths, tests_per_model=2, one_line=True):

    model_paths.sort(key=lambda p: len(p[0].name), reverse=True)
    column_length = len(model_paths[0][0].name) if model_paths else 10

    dataset_info = load_dataset(JSON_PATH)
    lines_num = sum(len(record["lines"]) for record in dataset_info)
    if tests_per_model is None or tests_per_model > lines_num :
        tests_per_model = lines_num
    
    print("Starting concurrent model tests...")
    frontline = " " * 6
    header = frontline
    for model_path in model_paths:
        name = model_path[0].name
        if len(name) % 2 == 1:
            name += " "
        header += "| " + " " * ((column_length - len(name)) // 2) + name + " " * ((column_length - len(name)) // 2) + " "
    print(header + "|")
    print(frontline + "-" * (len(header) + 1 - len(frontline)))

    queues = [mp.Queue() for _ in model_paths]

    processes = []
    for (model_path, handler), queue in zip(model_paths, queues):
        p = mp.Process(
            target=_run_model_in_process,
            args=(model_path, handler, tests_per_model, queue)
        )
        p.start()
        processes.append(p)

    prev_results = [0.0] * len(model_paths)
    counter = 0
    finished = [False] * len(model_paths)

    while not all(finished):
        row = []
        for i, queue in enumerate(queues):
            if finished[i]:
                row.append(prev_results[i])
                continue

            r = queue.get()
            if r is None:
                finished[i] = True
                row.append(prev_results[i])
            else:
                prev_results[i] = r
                row.append(r)

        counter += 1
        line = frontline
        for value in row:
            result_str = f"{value:.4f}"
            line += "| " + " " * ((column_length - len(result_str)) // 2) + result_str + " " * ((column_length - len(result_str)) // 2) + " "
        print(line + f"| {counter} / {tests_per_model + 1}", end="\r" if one_line else "\n")

    for p in processes:
        p.join()
    print(line + f"| {counter} / {tests_per_model + 1}")

if __name__ == "__main__" :
    
    test_models_concurrently([(MODEL_PATH, MODEL_HANDLER_PATH),
                              (Path(__file__).resolve().parent / ".." / "models" / "en_best.mlmodel", MODEL_HANDLER_PATH),
                            #   (Path(__file__).resolve().parent / ".." / "models" / "ocr_models" / "ocr_best_ketos_submitted.mlmodel", MODEL_HANDLER_PATH),
                              (Path(__file__).resolve().parent / ".." / "models" / "ocr_models" / "kraken.mlmodel", MODEL_HANDLER_PATH)
             ],
             tests_per_model=1000,
             one_line=True)