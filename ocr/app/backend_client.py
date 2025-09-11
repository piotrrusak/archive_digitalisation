import base64
import requests

def send_file(
    backend_url: str,
    auth_token: str,
    owner_id: int,
    format_id: int,
    generation: int,
    text: str,
    primary_file_id: int | None = None,
    timeout: int = 15,
) -> dict:
    url = f"{backend_url.rstrip('/')}/api/v1/stored_files"
    headers = {
        "Authorization": auth_token,
        "Content-Type": "application/json",
    }

    content_b64 = base64.b64encode(text.encode("utf-8")).decode("utf-8")

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
