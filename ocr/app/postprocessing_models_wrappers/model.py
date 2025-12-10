from abc import ABC, abstractmethod

from llama_cpp import Llama
from ocr.postprocessing.utils.paths import get_root_dir


class Model(ABC):
    def __init__(self, filename, n_gpu_layers):
        self.llm = Llama(
            model_path=str("models" / "postprocessing_models" / filename),
            n_ctx=4096 * 2,
            n_threads=32,
            n_gpu_layers=n_gpu_layers,
            n_batch=512,
            use_mmap=True,
            use_mlock=False,
            chat_format="gemma",
            verbose=False,
            stream=False,
        )

    @abstractmethod
    def __call__(self, request):
        pass

    def __str__(self):
        return self.__class__.__name__
