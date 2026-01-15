import base64
from typing import Any, Optional

import requests

API_BASE = "/backend/api/v1"


def get_format(
    backend_url: str,
    auth_token: Optional[str],
    format_name: Optional[str] = None,
    format_id: Optional[int] = None,
    timeout: int = 10,
) -> Optional[dict[str, Any]]:
    url = f"{backend_url.rstrip('/')}{API_BASE}/formats"
    headers = {}
    if auth_token:
        headers["Authorization"] = auth_token

    resp = requests.get(url, headers=headers, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()

    if not isinstance(data, list):
        raise ValueError("Unexpected formats response payload (expected a list)")

    for item in data:
        if isinstance(item, dict):
            if format_name and str(item.get("format", "")).lower() == format_name.lower():
                return item
            if format_id and item.get("id") == format_id:
                return item

    return None


def send_file(
    backend_url: str,
    auth_token: str,
    owner_id: int,
    format_id: int,
    generation: int,
    content_bytes: bytes,
    primary_file_id: Optional[int] = None,
    timeout: int = 15,
) -> dict[str, Any]:
    if not backend_url:
        raise ValueError("backend_url is required")

    if not auth_token:
        raise ValueError("auth_token is required")

    url = f"{backend_url.rstrip('/')}{API_BASE}/stored_files"
    headers = {
        "Authorization": auth_token,
        "Content-Type": "application/json",
    }

    content_b64 = base64.b64encode(content_bytes).decode("utf-8")

    payload = {
        "ownerId": owner_id,
        "formatId": format_id,
        "generation": generation + 1,
        "primaryFileId": primary_file_id,
        "content": content_b64,
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
    resp.raise_for_status()
    return resp.json()
