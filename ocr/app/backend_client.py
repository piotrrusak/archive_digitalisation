import base64
from typing import Optional, Dict, Any

import requests


def send_file(
    backend_url,
    auth_token,
    owner_id,
    format_id,
    generation,
    content_bytes,
    primary_file_id = None,
    timeout = 15,
) :
    if not backend_url :
        raise ValueError("backend_url is required")

    if not auth_token :
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
