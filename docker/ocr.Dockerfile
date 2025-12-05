FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY ../ocr .
EXPOSE 8000
CMD ["python", "main.py"]
