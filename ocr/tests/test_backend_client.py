import base64
from typing import Any

import pytest

from app import backend_client


class _DummyResponse:
    def __init__(self, payload: Any, status_code: int = 200) -> None:
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def json(self) -> Any:
        return self._payload


def test_get_format_by_name(monkeypatch: pytest.MonkeyPatch) -> None:
    expected = [
        {"format": "PDF", "id": 2},
        {"format": "png", "id": 1},
    ]

    def fake_get(url: str, headers: dict[str, str], timeout: int) -> _DummyResponse:
        assert url.endswith("/backend/api/v1/formats")
        assert headers["Authorization"] == "token"
        assert timeout == 10
        return _DummyResponse(expected)

    monkeypatch.setattr(backend_client.requests, "get", fake_get)

    result = backend_client.get_format(
        backend_url="http://example.com",
        auth_token="token",
        format_name="pdf",
    )
    assert result == expected[0]


def test_get_format_by_id(monkeypatch: pytest.MonkeyPatch) -> None:
    expected = [
        {"format": "PDF", "id": 2},
        {"format": "png", "id": 1},
    ]

    def fake_get(url: str, headers: dict[str, str], timeout: int) -> _DummyResponse:
        return _DummyResponse(expected)

    monkeypatch.setattr(backend_client.requests, "get", fake_get)

    result = backend_client.get_format(
        backend_url="http://example.com",
        auth_token=None,
        format_id=1,
    )
    assert result == expected[1]


def test_get_format_invalid_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url: str, headers: dict[str, str], timeout: int) -> _DummyResponse:
        return _DummyResponse({"unexpected": "payload"})

    monkeypatch.setattr(backend_client.requests, "get", fake_get)

    with pytest.raises(ValueError, match="Unexpected formats response payload"):
        backend_client.get_format("http://example.com", None)


def test_send_file_posts_expected_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_post(url: str, headers: dict[str, str], json: dict[str, Any], timeout: int) -> _DummyResponse:
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return _DummyResponse({"ok": True})

    monkeypatch.setattr(backend_client.requests, "post", fake_post)

    content = b"hello world"
    result = backend_client.send_file(
        backend_url="http://example.com",
        auth_token="token",
        owner_id=7,
        format_id=9,
        generation=3,
        content_bytes=content,
        primary_file_id=5,
        timeout=20,
    )

    assert result == {"ok": True}
    assert captured["url"].endswith("/backend/api/v1/stored_files")
    assert captured["headers"]["Authorization"] == "token"
    assert captured["headers"]["Content-Type"] == "application/json"
    assert captured["timeout"] == 20
    assert captured["json"]["ownerId"] == 7
    assert captured["json"]["formatId"] == 9
    assert captured["json"]["generation"] == 4
    assert captured["json"]["primaryFileId"] == 5
    assert base64.b64decode(captured["json"]["content"]) == content
