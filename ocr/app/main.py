from fastapi import FastAPI

app = FastAPI(title="OCR Service", version="0.1.0")

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/version")
def version():
    return {"version": app.version}
