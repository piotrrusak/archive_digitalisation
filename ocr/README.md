# OCR

## Run  
Python version is `3.11-slim`  
You will need to have `/ocr/.env` file with `BACKEND_BASE_URL` and `BACKEND_BASE_URL_DOCKER` specified for communication with backend


### Local

**It is highly recommended to use conda or any other kind of venv, because you will need to download huge number of libraries**


```bash
cd /ocr

pip install -r requirements.txt

python -u app/run.py
```

### Docker
`Note`: First run may take much longer due to the need to download libraries

```bash
docker compose up --build # build is just recommended to keep actual changes in code
```
