FROM python:3.11-slim
WORKDIR /ocr
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "-u", "app/run.py"]
