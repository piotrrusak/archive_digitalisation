# OCR

## Run (local)
You will need to have `/ocr/.env` file with `BACKEND_BASE_URL` specified for 

```bash
pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000
```
