from __future__ import annotations

import logging

import uvicorn
from fastapi import FastAPI
from main import app


def setup_logging() -> None:
    RESET: str = "\033[0m"
    COLORS: dict[str, str] = {
        "DEBUG": "\033[36m",  # cyan
        "INFO": "\033[32m",  # green
        "WARNING": "\033[33m",  # yellow
        "ERROR": "\033[31m",  # red
        "CRITICAL": "\033[41m\033[97m",  # white on red background
    }

    class ColorFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            original_levelname: str = record.levelname

            color: str = COLORS.get(original_levelname, "")
            padded: str = f"{original_levelname:<8}"
            record.levelname = f"{color}{padded}{RESET}"

            message: str = super().format(record)

            record.levelname = original_levelname

            return message

    fmt: str = "%(levelname)s %(asctime)s.%(msecs)03d   %(message)s"
    datefmt: str = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=logging.DEBUG,
        format=fmt,
        datefmt=datefmt,
    )

    root_logger = logging.getLogger()
    for handler in root_logger.handlers:
        handler.setFormatter(ColorFormatter(fmt, datefmt))


def main() -> None:
    setup_logging()

    for name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        logger = logging.getLogger(name)
        logger.handlers.clear()
        logger.propagate = True

    fastapi_app: FastAPI = app

    uvicorn.run(
        fastapi_app,
        host="0.0.0.0",
        port=8000,
        log_config=None,
    )


if __name__ == "__main__":
    main()
