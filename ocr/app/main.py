import base64
import json
import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

try:
    from app.backend_client import get_format, send_file
    from app.file_converter import convert_to_png_bytes
    from app.ocr import get_model_list, run_ocr
except Exception:
    try:
        from backend_client import get_format, send_file
        from file_converter import convert_to_png_bytes
        from ocr import get_model_list, run_ocr
    except Exception as e:
        raise ImportError("Failed to import necessary modules. Ensure the package structure is correct.") from e


load_dotenv()

BACKEND_URL = None

app = FastAPI(title="OCR Service", version="1.0.5")


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
            logging.error("Invalid base64 content: %s", e)
            raise ValueError(f"Invalid base64 content: {e}") from e
        return v

def strip_content(data):
    try:
        if "content" in data:
            data["content"] = "[SKIPPED]"
    except Exception:
        logging.warning("Failed to strip content from data for logging")
        data = "[NON-JSON BODY]"
    return data

def find_correct_backend_url(auth_header, format_id):
    global BACKEND_URL
    if BACKEND_URL is None :
        try:
            backend_base_url = os.getenv("BACKEND_BASE_URL_DOCKER")
            get_format(backend_base_url, auth_header, format_id=format_id)
            BACKEND_URL = backend_base_url
        except Exception:
            try:
                backend_base_url = os.getenv("BACKEND_BASE_URL")
                get_format(backend_base_url, auth_header, format_id=format_id)
                BACKEND_URL = backend_base_url
            except Exception as e:
                logging.critical("Failed to find backend URL: %s", e)
    return BACKEND_URL

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

    logging.debug("Full request (content skipped): %s\n", strip_content(json.loads(raw)))
    
    logging.debug(
        "Received file: id=%s, ownerId=%s formatId=%s generation=%s primaryFileId=%s model_id=%s size_b64=%d",
        payload.id,
        payload.ownerId,
        payload.formatId,
        payload.generation,
        payload.primaryFileId,
        payload.processingModelId,
        len(payload.content),
    )

    auth_header = request.headers.get("authorization")

    backend_base_url = find_correct_backend_url(
        auth_header=auth_header,
        format_id=payload.formatId,
    )

    in_bytes = convert_to_png_bytes(
        base64.b64decode(payload.content, validate=True),
        get_format(backend_base_url, auth_header, format_id=payload.formatId),
        debug=True,
        debug_indent=1,
    )

    out_pdf_bytes, out_docx_bytes = run_ocr(in_bytes, model_id=payload.processingModelId, debug=True, debug_indent=1)
    logging.info("OCR processing completed")
    logging.debug("OCR produced output PDF bytes: %d bytes", len(out_pdf_bytes))
    logging.debug("OCR produced output DOCX bytes: %d bytes", len(out_docx_bytes))

    out_pdf_format = get_format(backend_base_url, auth_header, format_name="pdf")
    if not out_pdf_format:
        logging.critical("PDF format not found in backend formats")
        raise HTTPException(status_code=404, detail="PDF format not found in backend formats")
    logging.info("Sending OCR result as PDF format (%s) to backend", out_pdf_format)

    result = send_file(
        backend_url=backend_base_url,
        auth_token=auth_header,
        owner_id=payload.ownerId,
        format_id=out_pdf_format["id"],
        generation=payload.generation,
        content_bytes=out_pdf_bytes,
        primary_file_id=payload.id,
    )

    logging.info("Sent OCR result back to backend, got response: %s", strip_content(result))


    out_docx_format = get_format(backend_base_url, auth_header, format_name="docx")
    if not out_docx_format:
        logging.critical("DOCX format not found in backend formats")
        raise HTTPException(status_code=404, detail="DOCX format not found in backend formats")
    logging.info("Sending OCR result as DOCX format (%s) to backend", out_docx_format)

    result = send_file(
        backend_url=backend_base_url,
        auth_token=auth_header,
        owner_id=payload.ownerId,
        format_id=out_docx_format["id"],
        generation=payload.generation,
        content_bytes=out_docx_bytes,
        primary_file_id=payload.id,
    )
    logging.info("Sent OCR result back to backend, got response: %s", strip_content(result))

    return result


@app.get("/ocr/available_models")
def available_models():
    try:
        return [{k: v for k, v in model.items() if k != "handle"} for model in get_model_list()]
    except Exception as e:
        logging.critical("Error listing available models: %s", e)
        raise HTTPException(status_code=500, detail="Failed to list available models") from e

@app.get("/ocr/health")
def health():
    return {"status": "ok"}