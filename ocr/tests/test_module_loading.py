from pathlib import Path

import pytest

from app.module_loading import load_module_from_path


def test_load_module_from_path(tmp_path: Path) -> None:
    module_path = tmp_path / "temp_module.py"
    module_path.write_text("VALUE = 123\n", encoding="utf-8")

    module = load_module_from_path(module_path)

    assert module.VALUE == 123


def test_load_module_from_path_invalid_module(tmp_path: Path) -> None:
    module_path = tmp_path / "bad_module.py"
    module_path.write_text("def broken(:\n", encoding="utf-8")

    with pytest.raises(ImportError):
        load_module_from_path(module_path)
