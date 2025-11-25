import base64
import logging
import os

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

try:
    from app.backend_client import get_format, send_file
    from app.ocr import get_model_list, run_ocr
except ImportError:
    try:
        from backend_client import get_format, send_file
        from ocr import get_model_list, run_ocr
    except ImportError as e:
        raise ImportError("Failed to import necessary modules. Ensure the package structure is correct.") from e

app = FastAPI(title="OCR Service", version="1.0.4") # I forgor to update versions, but this is correct one
logger = logging.getLogger("uvicorn.error")


class IncomingFile(BaseModel):
    ownerId: int = Field(ge=1)
    formatId: int = Field(ge=1)
    generation: int = Field(ge=0)
    primaryFileId: int | None = None
    model_id: int = 1
    content: str

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
def handle_file(payload: IncomingFile, request: Request):
    logger.info(
        "Received file: ownerId=%s formatId=%s generation=%s primaryFileId=%s model_id=%s size_b64=%d",
        payload.ownerId,
        payload.formatId,
        payload.generation,
        payload.primaryFileId,
        payload.model_id,
        len(payload.content),
    )

    try:
        png_bytes = base64.b64decode(payload.content, validate=True)
    except Exception as err:
        raise HTTPException(status_code=400, detail="Invalid base64 in 'content'") from err

    docx_bytes = run_ocr(png_bytes, model_id=payload.model_id, debug=True, debug_indent=1)
    logger.info("OCR produced DOCX bytes: %d bytes", len(docx_bytes))

    backend_base_url = os.getenv("BACKEND_BASE_URL")
    auth_header = request.headers.get("authorization")

    docx_format = get_format(backend_base_url, auth_header, "docx")
    logger.info("Using backend DOCX format: %s", docx_format)

    result = send_file(
        backend_url=backend_base_url,
        auth_token=auth_header,
        owner_id=payload.ownerId,
        format_id=docx_format["id"],
        generation=payload.generation,
        content_bytes=docx_bytes,
        primary_file_id=payload.primaryFileId,
    )

    logger.info("Sent OCR DOCX back to backend, got response: %s", result)
    return result


@app.get("/ocr/available_models")
def available_models():
    try:
        return [
                {k: v for k, v in model.items() if k != "handle"} 
                for model in get_model_list()
            ]
    except Exception as e:
        logger.error("Error listing available models: %s", e)
        raise HTTPException(status_code=500, detail="Failed to list available models") from e
