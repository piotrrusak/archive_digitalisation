from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
import base64
import logging
import asyncio

from app.ocr import ocr_png_bytes
from app.backend_client import post_stored_file, get_txt_format_id

app = FastAPI(title="OCR Service", version="0.0.2")
logger = logging.getLogger("uvicorn.error")

class IncomingFile(BaseModel) :
    ownerId: int = Field(ge=1)
    formatId: int = Field(ge=1)
    generation: int = Field(ge=0)
    primaryFileId: int | None = None
    content: str

    @field_validator("content")
    @classmethod
    def validate_base64(cls, v) :
        try :
            base64.b64decode(v, validate = True)
        except Exception as e :
            raise ValueError(f"Invalid base64 content: {e}")
        return v

@app.get("/health")
def health() :
    return {"status" : "ok"}

@app.post("/ocr/process")
def receive_file(payload : IncomingFile) :
    logger.info(
        "Received file: ownerId=%s formatId=%s generation=%s primaryFileId=%s size_b64=%d",
        payload.ownerId, payload.formatId, payload.generation, payload.primaryFileId, len(payload.content),
    )

    try :
        png_bytes = base64.b64decode(payload.content, validate=True)
    except Exception :
        raise HTTPException(status_code=400, detail="Invalid base64 in 'content'")

    text = ocr_png_bytes(png_bytes)
    logger.info("OCR result: %s", text)

    try :
        txt_format_id = asyncio.run(get_txt_format_id())
    except RuntimeError as e :
        raise HTTPException(status_code=500, detail=str(e))
    out_generation = (payload.generation or 0) + 1

    try :
        stored = asyncio.run(post_stored_file(
            owner_id=payload.ownerId,
            format_id_txt=txt_format_id,
            generation=out_generation,
            primary_file_id=payload.primaryFileId,
            text=text,
        ))
    except Exception as e :
        raise HTTPException(status_code=502, detail=f"Failed to POST to backend: {e}")

    return {
        "status" : "sent",
        "backendStoredFile" : stored,
    }
