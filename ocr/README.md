# OCR

## Run  
You will need to have `/ocr/.env` file with `BACKEND_BASE_URL` and `BACKEND_BASE_URL_DOCKER` specified for communication with backend

### Local

**It is highly recommended to use conda or any other kind of venv, because you will need to download huge number of libraries**


```bash
cd /ocr

pip install -r requirements.txt

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker
`Note`: First run may take much longer due to the need to actually download libraries

```bash
docker compose up --build # build is just recommended to keep actual changes in code
```
