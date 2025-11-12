import base64

import requests


def get_pdf_format(backend_url, auth_token, timeout=10):
    url = f"{backend_url.rstrip('/')}/api/v1/formats"
    headers = {}
    if auth_token:
        headers["Authorization"] = auth_token

    resp = requests.get(url, headers=headers, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()

    if not isinstance(data, list):
        raise ValueError("Unexpected formats response payload (expected a list)")

    for item in data:
        if isinstance(item, dict) and str(item.get("format", "")).lower() == "pdf":
            return item

    raise ValueError("PDF format not found in backend formats list")


def send_file(
    backend_url,
    auth_token,
    owner_id,
    format_id,
    generation,
    content_bytes,
    primary_file_id=None,
    timeout=15,
):
    if not backend_url:
        raise ValueError("backend_url is required")

    if not auth_token:
        raise ValueError("auth_token is required")

    url = f"{backend_url.rstrip('/')}/api/v1/stored_files"
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
