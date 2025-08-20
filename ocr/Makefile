.PHONY: dev test lint fmt

dev:
	uvicorn app.main:app --reload

test:
	pytest --maxfail=1

lint:
	ruff check .

fmt:
	ruff check . --fix
