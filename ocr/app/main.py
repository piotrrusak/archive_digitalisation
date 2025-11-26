import base64
import json
import logging
import os

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

try:
    from app.backend_client import get_format, send_file
    from app.file_converter import convert_to_png_bytes
    from app.ocr import get_model_list, run_ocr
except ImportError:
    try:
        from backend_client import get_format, send_file
        from file_converter import convert_to_png_bytes
        from ocr import get_model_list, run_ocr
    except ImportError as e:
        raise ImportError("Failed to import necessary modules. Ensure the package structure is correct.") from e

app = FastAPI(title="OCR Service", version="1.0.4")  # I forgor to update versions, but this is correct one
logger = logging.getLogger("uvicorn.error")


class IncomingFile(BaseModel):
    ownerId: int = Field(ge=1)
    formatId: int = Field(ge=1)
    generation: int = Field(ge=0)
    primaryFileId: int | None = None
    processingModelId: int | None
    content: str
    id: int | None = None

    @field_validator("content")
    @classmethod
    def validate_base64(cls, v):
        try:
            base64.b64decode(v, validate=True)
        except Exception as e:
            raise ValueError(f"Invalid base64 content: {e}") from e
        return v


@app.get("/health")
def health():
    try:
        _ = get_model_list()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.post("/ocr/process")
async def handle_file(payload: IncomingFile, request: Request):
    
    raw = await request.body()

    try:
        data = json.loads(raw)
        if "content" in data :
            data["content"] = "[SKIPPED]"
    except Exception:
        # fallback jeśli body to nie JSON
        data = "[NON-JSON BODY]"

    logger.info("Full request (content skipped): %s", data)
    
    logger.info(
        "Received file: id=%s, ownerId=%s formatId=%s generation=%s primaryFileId=%s model_id=%s size_b64=%d",
        payload.id,
        payload.ownerId,
        payload.formatId,
        payload.generation,
        payload.primaryFileId,
        payload.processingModelId,
        len(payload.content),
    )

    backend_base_url = os.getenv("BACKEND_BASE_URL")
    auth_header = request.headers.get("authorization")

    in_bytes = convert_to_png_bytes(
        base64.b64decode(payload.content, validate=True),
        get_format(backend_base_url, auth_header, format_id=payload.formatId),
        debug=True,
        debug_indent=1,
    )

    out_bytes = run_ocr(in_bytes, model_id=payload.processingModelId, debug=True, debug_indent=1)
    logger.info("OCR produced output bytes: %d bytes", len(out_bytes))

    # out_format = get_format(backend_base_url, auth_header, format_name="docx")
    out_format = get_format(backend_base_url, auth_header, format_name="pdf")
    logger.info("Using backend out format: %s", out_format)

    result = send_file(
        backend_url=backend_base_url,
        auth_token=auth_header,
        owner_id=payload.ownerId,
        format_id=out_format["id"],
        generation=payload.generation,
        content_bytes=out_bytes,
        primary_file_id=payload.id,
    )

    logger.info("Sent OCR DOCX back to backend, got response: %s", result)
    return result


@app.get("/ocr/available_models")
def available_models():
    try:
        return [{k: v for k, v in model.items() if k != "handle"} for model in get_model_list()]
    except Exception as e:
        logger.error("Error listing available models: %s", e)
        raise HTTPException(status_code=500, detail="Failed to list available models") from e
