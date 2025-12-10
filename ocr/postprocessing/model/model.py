import os
from abc import ABC, abstractmethod
from llama_cpp import Llama
from ocr.postprocessing.utils.paths import get_root_dir

class Model(ABC):
    def __init__(self, filename, n_gpu_layers):
        self.llm = Llama(
            model_path=str(get_root_dir() / "models" / "postprocessing_models" / filename),
            n_ctx=4096*2,
            n_threads=32,
            n_gpu_layers=n_gpu_layers,
            n_batch=512,
            use_mmap=True,
            use_mlock=False,
            chat_format="gemma",
            verbose=False,
            stream=False, # Theoretically False is default, but just to be sure. This enables partial outputs like in ChatGPT. I want one output after full response is ready.
        )

    @abstractmethod
    def __call__(self, request):
        pass

    def __str__(self):
        return self.__class__.__name__