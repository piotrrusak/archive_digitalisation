import logging

BASE_LOGGER = logging.WARNING

def setup_logging(level=BASE_LOGGER):
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        force=True
    )