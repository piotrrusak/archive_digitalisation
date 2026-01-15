from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from llama_cpp import Llama

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent

class Model(ABC):
    def __init__(self, filename: str, n_gpu_layers: int) -> None:
        self.llm = Llama(
            model_path=str(PROJECT_DIR / "models" / "postprocessing_models" / filename),
            n_ctx=2048,
            n_threads=32,
            n_gpu_layers=n_gpu_layers,
            n_batch=64,
            use_mmap=True,
            use_mlock=False,
            chat_format="gemma",
            verbose=True,
            stream=False,
        )

    @abstractmethod
    def __call__(self, request: str) -> Any:
        pass

    def __str__(self) -> str:
        return self.__class__.__name__
