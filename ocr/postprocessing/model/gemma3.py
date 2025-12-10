from ocr.postprocessing.model.model import Model
from llama_cpp.llama_grammar import LlamaGrammar, JSON_GBNF, json_schema_to_gbnf

class Gemma3(Model):
    def __init__(self, n_gpu_layers=31): # While testing i figure out that 31 is max on my current laptop gpu.
        super().__init__(filename="google_gemma-3-12b-it-qat-Q4_0.gguf", n_gpu_layers=n_gpu_layers)

    def __call__(self, request, max_tokens=200, temperature=0.7, **kwargs):

        return self.llm.create_completion(
            prompt=request,
            max_tokens=max_tokens,
            temperature=temperature,
            grammar = LlamaGrammar(_grammar=json_schema_to_gbnf(kwargs["schema"], kwargs["order"]))
        )