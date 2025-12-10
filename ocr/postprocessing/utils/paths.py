from pathlib import Path


def get_root_dir() -> Path:
    file_dir = Path(__file__).resolve()
    for parent in (file_dir, *file_dir.parents):
        if (parent / "models").is_dir():
            return parent
    raise FileNotFoundError("Project root directory could not be determined")
