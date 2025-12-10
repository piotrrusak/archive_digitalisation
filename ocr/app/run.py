import logging

import uvicorn
from main import app


def setup_logging() :
    RESET = "\033[0m"
    COLORS = {
        "DEBUG": "\033[36m",             # cyan
        "INFO": "\033[32m",              # green
        "WARNING": "\033[33m",           # yellow
        "ERROR": "\033[31m",             # red
        "CRITICAL": "\033[41m\033[97m",  # white on red background
    }

    class ColorFormatter(logging.Formatter) :
        def format(self, record) :
            original_levelname = record.levelname

            color = COLORS.get(original_levelname, "")
            padded = f"{original_levelname:<8}"
            record.levelname = f"{color}{padded}{RESET}"

            message = super().format(record)

            record.levelname = original_levelname

            return message

    fmt = "%(levelname)s %(asctime)s.%(msecs)03d   %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=logging.DEBUG,
        format=fmt,
        datefmt=datefmt
    )

    root_logger = logging.getLogger()
    for handler in root_logger.handlers :
        handler.setFormatter(ColorFormatter(fmt, datefmt))

def main() :
    setup_logging()

    for name in ["uvicorn", "uvicorn.error", "uvicorn.access"] :
        logger = logging.getLogger(name)
        logger.handlers.clear()
        logger.propagate = True

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_config=None,
    )


if __name__ == "__main__" :
    main()
