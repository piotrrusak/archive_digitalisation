import io
from typing import Any, Callable

import pytest
from PIL import Image

from app import ocr as ocr_module


def _png_bytes() -> bytes:
    image = Image.new("RGB", (4, 4), (0, 0, 0))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def test_get_model_handler_returns_specific(monkeypatch: pytest.MonkeyPatch) -> None:
    handler_1: Callable[..., str] = lambda *args, **kwargs: "h1"
    handler_2: Callable[..., str] = lambda *args, **kwargs: "h2"
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
    handler_1: Callable[..., str] = lambda *args, **kwargs: "h1"
    handler_2: Callable[..., str] = lambda *args, **kwargs: "h2"
    monkeypatch.setattr(
        ocr_module,
        "MODEL_LIST",
        [
            {"id": 1, "handle": handler_1},
            {"id": 2, "handle": handler_2},
        ],
    )

    assert ocr_module.get_model_handler(999) is handler_1


def test_run_ocr_one_liner(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_get_model_handler(model_id: int, debug: bool = False, debug_indent: int = 0) -> Callable[..., str]:
        def handler(_img: Image.Image, seg_info: dict[str, Any], **_kwargs: Any) -> str:
            captured["seg_info"] = seg_info
            return "TEXT"

        return handler

    class _DummyDoc:
        pass

    def fake_initialize_pdf_with_image(_im: Image.Image, visible_image: bool = False) -> _DummyDoc:
        return _DummyDoc()

    def fake_insert_text_at_bbox(_doc: _DummyDoc, text: str, bbox: tuple[int, int, int, int], **_kwargs: Any) -> None:
        captured["insert"] = (text, bbox)

    monkeypatch.setattr(ocr_module, "get_model_handler", fake_get_model_handler)
    monkeypatch.setattr(ocr_module, "initialize_pdf_with_image", fake_initialize_pdf_with_image)
    monkeypatch.setattr(ocr_module, "insert_text_at_bbox", fake_insert_text_at_bbox)
    monkeypatch.setattr(ocr_module, "pdf_to_bytes", lambda _doc: b"pdf-bytes")
    monkeypatch.setattr(ocr_module, "pdf_to_docx_bytes", lambda _doc: b"docx-bytes")

    pdf_bytes, docx_bytes = ocr_module.run_ocr(_png_bytes(), model_id=1, one_liner=True, debug=False)

    assert (pdf_bytes, docx_bytes) == (b"pdf-bytes", b"docx-bytes")
    assert captured["insert"][0] == "TEXT"
    x0, y0, x1, y1 = captured["insert"][1]
    assert (x0, y0) == (0, 0)
    assert x1 > 0 and y1 > 0
