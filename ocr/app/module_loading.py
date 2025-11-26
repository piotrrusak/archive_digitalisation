from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


@dataclass(frozen=True)
class ModelSpec:
    name: str
    path: Path
    description: str
    handle: Callable


def load_module_from_path(path):
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
