from __future__ import annotations
import os
import base64
import httpx

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8080")
BACKEND_AUTH_BEARER = os.getenv("BACKEND_AUTH_BEARER", "") or None
TXT_FORMAT_ID_ENV = os.getenv("TXT_FORMAT_ID")

def _auth_headers() :
    if BACKEND_AUTH_BEARER:
        return {"Authorization": f"Bearer {BACKEND_AUTH_BEARER}"}
    return {}

async def post_stored_file(
    owner_id,
    format_id_txt,
    generation,
    primary_file_id,
    text
) :
    payload = {
        "ownerId" : owner_id,
        "formatId" : format_id_txt,
        "generation" : generation,
        "primaryFileId" : primary_file_id,
        "content" : base64.b64encode(text.encode("utf-8")).decode("ascii"),
    }
    async with httpx.AsyncClient(timeout=30) as client :
        r = await client.post(
            f"{BACKEND_BASE_URL}/api/v1/stored_files",
            json=payload,
            headers=_auth_headers(),
        )
        r.raise_for_status()
        return r.json()

async def get_txt_format_id() :
    if TXT_FORMAT_ID_ENV is not None :
        return int(TXT_FORMAT_ID_ENV)

    async with httpx.AsyncClient(timeout=15) as client :
        r = await client.get(f"{BACKEND_BASE_URL}/api/v1/formats", headers=_auth_headers())
        r.raise_for_status()
        formats = r.json()
        for f in formats :
            name = (f.get("name") or "").lower()
            mime = (f.get("mime") or "").lower()
            if name == "txt" or mime == "text/plain" :
                return int(f["id"])
    raise RuntimeError("No TXT format found")
