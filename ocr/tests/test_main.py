from typing import Any

import pytest

from app import main as main_module


def test_strip_content_replaces_payload() -> None:
    data = {"content": "secret", "other": 123}
    result = main_module.strip_content(data)
    assert result["content"] == "[SKIPPED]"
    assert result["other"] == 123


def test_strip_content_handles_non_dict() -> None:
    result = main_module.strip_content("raw-body")
    assert result == "raw-body"


def test_find_correct_backend_url_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str | None, str | None, int]] = []

    def fake_get_format(url: str | None, auth: str | None, format_id: int) -> dict[str, Any]:
        calls.append((url, auth, format_id))
        if url == "http://docker":
            raise RuntimeError("not reachable")
        return {"id": format_id}

    monkeypatch.setattr(main_module, "get_format", fake_get_format)
    monkeypatch.setenv("BACKEND_BASE_URL_DOCKER", "http://docker")
    monkeypatch.setenv("BACKEND_BASE_URL", "http://backend")
    monkeypatch.setattr(main_module, "BACKEND_URL", None)

    result = main_module.find_correct_backend_url(auth_header="token", format_id=5)

    assert result == "http://backend"
    assert calls == [("http://docker", "token", 5), ("http://backend", "token", 5)]
