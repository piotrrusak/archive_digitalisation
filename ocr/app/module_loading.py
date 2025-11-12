from __future__ import annotations

from dataclasses import dataclass
from importlib.util import spec_from_file_location, module_from_spec
from pathlib import Path
from types import ModuleType
from typing import Callable, List


@dataclass(frozen=True)
class ModelSpec:
    name: str
    path: Path
    description: str
    handle: Callable


def load_module_from_path (path: Path) -> ModuleType:
    """Load a Python module from an arbitrary file path without polluting sys.modules with a name collision."""
    # Use a unique module name derived from the file path to avoid clobbering.
    unique_name = f"_ocr_model_{path.stem}_{abs(hash(path.as_posix()))}"
    spec = spec_from_file_location(unique_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot create spec for {path}")
    module = module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except Exception as err:
        # Preserve the original traceback origin
        raise ImportError(f"Error while importing {path}") from err
    return module