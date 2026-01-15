import io
from collections.abc import Callable
from typing import Any

import pytest
from PIL import Image

from app import ocr as ocr_module


def _png_bytes() -> bytes:
    image = Image.new("RGB", (4, 4), (0, 0, 0))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def test_get_model_handler_returns_specific(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler_1(*args, **kwargs) -> str:
        return "h1"
    def handler_2(*args, **kwargs) -> str:
        return "h2"
    monkeypatch.setattr(
        ocr_module,
        "MODEL_LIST",
        [
            {"id": 1, "handle": handler_1},
            {"id": 2, "handle": handler_2},
        ],
    )

    assert ocr_module.get_model_handler(2) is handler_2


def test_get_model_handler_fallback_to_id_1(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler_1(*args, **kwargs) -> str:
        return "h1"
    def handler_2(*args, **kwargs) -> str:
        return "h2"
    monkeypatch.setattr(
        ocr_module,
        "MODEL_LIST",
        [
            {"id": 1, "handle": handler_1},
            {"id": 2, "handle": handler_2},
        ],
    )

    assert ocr_module.get_model_handler(999) is handler_1

