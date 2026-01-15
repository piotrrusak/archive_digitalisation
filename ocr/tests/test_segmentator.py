from __future__ import annotations

import contextlib
from typing import Any

import numpy as np
import pytest
from PIL import Image

from app import segmentator as segmentator_module


def test_bbox_from_line_bbox() -> None:
    class Line:
        bbox = (1, 2, 3, 4)

    assert segmentator_module._bbox_from_line(Line(), 10, 10) == (1, 2, 3, 4)


def test_bbox_from_line_boundary() -> None:
    class Line:
        boundary = [(2, 3), (4, 6), (1, 5)]

    assert segmentator_module._bbox_from_line(Line(), 10, 10) == (1, 3, 4, 6)


def test_bbox_from_line_baseline() -> None:
    class Line:
        baseline = [(1, 2), (3, 4)]

    assert segmentator_module._bbox_from_line(Line(), 10, 100) == (1, 0, 3, 9)


def test_segment_lines_from_image_return_modes(monkeypatch: pytest.MonkeyPatch) -> None:
    class Line:
        bbox = (1, 1, 3, 3)
        baseline = [(1, 2), (2, 2)]
        boundary = [(1, 1), (3, 1), (3, 3), (1, 3)]
        tags = ["tag"]
        regions = ["region"]
        type = "line"

    class DummyBounds:
        lines = [Line()]

    def fake_load_seg_model(device: str | None, seg_model_path: Any) -> object:
        return object()

    def fake_segment(im: Image.Image, model: object, device: str, text_direction: str) -> DummyBounds:
        return DummyBounds()

    @contextlib.contextmanager
    def fake_inference_mode():
        yield

    monkeypatch.setattr(segmentator_module, "_load_seg_model", fake_load_seg_model)
    monkeypatch.setattr(segmentator_module.blla, "segment", fake_segment)
    monkeypatch.setattr(segmentator_module.torch, "inference_mode", fake_inference_mode)

    im = Image.new("RGB", (10, 10), (0, 0, 0))

    array_results = segmentator_module.segment_lines_from_image(im, return_mode="array")
    assert array_results[0]["bbox"] == (1, 1, 3, 3)
    assert isinstance(array_results[0]["array"], np.ndarray)

    pil_results = segmentator_module.segment_lines_from_image(im, return_mode="pil")
    assert isinstance(pil_results[0]["pil_image"], Image.Image)
