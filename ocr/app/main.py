import base64
import logging
import os

from fastapi import FastAPI, Request
from pydantic import BaseModel, Field, field_validator

from app.backend_client import send_file
from app.ocr import _get_model, ocr_png_bytes

app = FastAPI(title="OCR Service", version="0.0.2")
logger = logging.getLogger("uvicorn.error")


class IncomingFile(BaseModel):
    ownerId: int = Field(ge=1)
    formatId: int = Field(ge=1)
    generation: int = Field(ge=0)
    primaryFileId: int | None = None
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
        _ = _get_model()
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


@app.post("/ocr/process")
def handle_file(payload: IncomingFile, request: Request):
    logger.info(
        "Received file: ownerId=%s formatId=%s generation=%s primaryFileId=%s size_b64=%d",
        payload.ownerId,
        payload.formatId,
        payload.generation,
        payload.primaryFileId,
        len(payload.content),
    )

    try:
        png_bytes = base64.b64decode(payload.content, validate=True)
    except Exception:
        raise Exception(detail="Invalid base64 in 'content'") from None

    text = ocr_png_bytes(png_bytes)
    logger.info("OCR result: %s", text)

    result = send_file(
        backend_url=os.getenv("BACKEND_BASE_URL"),
        auth_token=request.headers.get("authorization"),
        owner_id=payload.ownerId,
        format_id=payload.formatId,
        generation=payload.generation,
        text=text,
        primary_file_id=payload.primaryFileId,
    )
    logger.info("Sent OCR result back to backend, got response: %s", result)

    return result

