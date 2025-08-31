from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
import base64
import logging

app = FastAPI(title="OCR Service", version="0.0.1")

logger = logging.getLogger("uvicorn.error")


class IncomingFile(BaseModel):
    ownerId: int = Field(ge=1)
    formatId: int = Field(ge=1)
    generation: int = Field(ge=0)
    primaryFileId: int | None = None
    content: str

    @field_validator("content")
    @classmethod
    def validate_base64(cls, v: str) -> str:
        try:
            base64.b64decode(v, validate=True)
        except Exception as e:
            raise ValueError(f"Invalid base64 content: {e}")
        return v


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr/process")
def receive_file(payload: IncomingFile):
    logger.info(
        "Received file: ownerId=%s formatId=%s generation=%s primaryFileId=%s size_b64=%d",
        payload.ownerId,
        payload.formatId,
        payload.generation,
        payload.primaryFileId,
        len(payload.content),
    )

    return {
        "status": "received",
        "ownerId": payload.ownerId,
        "formatId": payload.formatId,
        "generation": payload.generation,
        "primaryFileId": payload.primaryFileId,
    }
