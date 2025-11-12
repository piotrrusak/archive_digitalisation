import os
from pathlib import Path

import pytest

import app.ocr as ocr_module

DIR_PATH = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "files")))
LEV_PERCENTAGE = 0.35


LEV_AVAILABLE = True
LEV_SOURCE = None
try:
    from rapidfuzz.distance import Levenshtein as _Lev

    def lev_distance(a: str, b: str) -> int:
        return _Lev.distance(a, b)

    LEV_SOURCE = "rapidfuzz.distance.Levenshtein"
    pass
except Exception:
    try:
        from Levenshtein import distance as _lev_distance  # type: ignore

        def lev_distance(a: str, b: str) -> int:
            return _lev_distance(a, b)

        LEV_SOURCE = "python-Levenshtein"
    except Exception:
        LEV_AVAILABLE = False
        LEV_SOURCE = "not available"


def _normalize_text(s: str) -> str:
    return " ".join((s or "").split()).strip().lower()


def _collect_cases(data_dir: Path):
    if not data_dir.exists():
        return [pytest.param(None, None, marks=pytest.mark.skip(reason="DIR_PATH does not exist."))]

    pngs = sorted(data_dir.glob("*.png"))
    if not pngs:
        return [pytest.param(None, None, marks=pytest.mark.skip(reason="No .png files found in DIR_PATH."))]

    params = []
    for png in pngs:
        txt = png.with_suffix(".txt")
        if not txt.exists():
            params.append(
                pytest.param(
                    png,
                    None,
                    marks=pytest.mark.skip(reason=f"Missing ground-truth TXT for {png.name}. Expecting {txt.name}."),
                )
            )
        else:
            params.append(pytest.param(png, txt, id=png.name))
    return params


PARAMS = _collect_cases(DIR_PATH)


@pytest.fixture(autouse=True)
def reset_model_cache():
    if hasattr(ocr_module, "_MODEL"):
        ocr_module._MODEL = None
    yield
    if hasattr(ocr_module, "_MODEL"):
        ocr_module._MODEL = None


@pytest.mark.parametrize("png_path, gt_path", PARAMS)
def test_ocr_quality_dynamic_threshold(png_path: Path, gt_path: Path, capsys):
    if png_path is None or gt_path is None:
        pytest.skip("Invalid parameters for this test case.")

    if not LEV_AVAILABLE:
        pytest.skip("Levenshtein implementation is not available (install rapidfuzz or python-Levenshtein).")

    img_bytes = png_path.read_bytes()
    expected_text = gt_path.read_text(encoding="utf-8", errors="ignore")

    got_text = ocr_module.ocr_png_bytes(img_bytes)

    got_norm = _normalize_text(got_text)
    exp_norm = _normalize_text(expected_text)

    dist = lev_distance(got_norm, exp_norm)
    allowed = max(1, int(len(exp_norm) * LEV_PERCENTAGE))

    capsys.readouterr()

    assert dist <= allowed, (
        f"Levenshtein distance ({dist}) exceeds allowed threshold ({allowed}) for file {png_path.name}"
    )
