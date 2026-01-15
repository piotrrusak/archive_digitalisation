import io
from pathlib import Path

import pytest
from PIL import Image

from app import file_converter


def test_convert_to_png_bytes_passthrough() -> None:
    payload = b"raw_png_bytes"
    result = file_converter.convert_to_png_bytes(payload, {"format": "png"})
    assert result == payload


def test_convert_to_png_bytes_image() -> None:
    image = Image.new("RGB", (4, 4), (120, 5, 200))
    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    jpeg_bytes = buf.getvalue()

    result = file_converter.convert_to_png_bytes(jpeg_bytes, {"format": "jpeg"})
    assert result.startswith(b"\x89PNG\r\n\x1a\n")


def test_convert_to_png_bytes_pdf(monkeypatch: pytest.MonkeyPatch) -> None:
    class _DummyPixmap:
        def tobytes(self, fmt: str) -> bytes:
            assert fmt == "png"
            return b"png-bytes"

    class _DummyPage:
        def get_pixmap(self) -> _DummyPixmap:
            return _DummyPixmap()

    class _DummyDoc:
        def load_page(self, index: int) -> _DummyPage:
            assert index == 0
            return _DummyPage()

    def fake_open(stream: bytes, filetype: str) -> _DummyDoc:
        assert stream == b"%PDF"
        assert filetype == "pdf"
        return _DummyDoc()

    monkeypatch.setattr(file_converter.fitz, "open", fake_open)

    result = file_converter.convert_to_png_bytes(b"%PDF", {"format": "pdf"})
    assert result == b"png-bytes"


def test_convert_to_png_bytes_unsupported() -> None:
    with pytest.raises(ValueError, match="Unsupported input format"):
        file_converter.convert_to_png_bytes(b"data", {"format": "zip"})


def test_find_fontsize_uses_line_bounds(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, float, str]] = []

    def fake_measure(text: str, fontsize: float, fontname: str = "helv") -> tuple[float, int]:
        calls.append((text, fontsize, fontname))
        return fontsize * 2, int(fontsize)

    monkeypatch.setattr(file_converter, "measure_text_single_line", fake_measure)

    result = file_converter.find_fontsize(line_height=12, line_width=10, text="abc")
    assert 0 <= result < 12
    assert calls


def test_save_docx_to_path(tmp_path: Path) -> None:
    out_path = tmp_path / "out.docx"
    payload = b"docx-data"
    file_converter.save_docx_to_path(payload, out_path)
    assert out_path.read_bytes() == payload
