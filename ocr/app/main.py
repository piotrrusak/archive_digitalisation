import base64
import logging
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from app.backend_client import get_pdf_format, send_file
from app.ocr import _get_model, run_ocr, test_ocr

app = FastAPI(title="OCR Service", version="0.0.3")
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
    except Exception as err:
        raise HTTPException(status_code=400, detail="Invalid base64 in 'content'") from err

    pdf_bytes = run_ocr(png_bytes)
    logger.info("OCR produced PDF bytes: %d bytes", len(pdf_bytes))

    backend_base_url = os.getenv("BACKEND_BASE_URL")
    auth_header = request.headers.get("authorization")

    pdf_format = get_pdf_format(backend_base_url, auth_header)
    logger.info("Using backend PDF format: %s", pdf_format)

    result = send_file(
        backend_url=backend_base_url,
        auth_token=auth_header,
        owner_id=payload.ownerId,
        format_id=pdf_format["id"],
        generation=payload.generation,
        content_bytes=pdf_bytes,
        primary_file_id=payload.primaryFileId,
    )

    logger.info("Sent OCR PDF back to backend, got response: %s", result)
    return result


if __name__ == "__main__":
    test_ocr(Path(__file__).resolve().parent / "../model_training/data/0000.png")
