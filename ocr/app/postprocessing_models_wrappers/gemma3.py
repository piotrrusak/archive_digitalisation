from llama_cpp.llama_grammar import LlamaGrammar, json_schema_to_gbnf

try :
    from app.postprocessing_models_wrappers.model import Model
except Exception :
    try :
        from postprocessing_models_wrappers.model import Model
    except Exception as e:
        raise ImportError("Failed to import Model base class. Ensure the package structure is correct.") from e

class Gemma3(Model):
    def __init__(self, n_gpu_layers=10):
        super().__init__(filename="google_gemma-3-12b-it-qat-Q4_0.gguf", n_gpu_layers=n_gpu_layers)

    def __call__(self, request, max_tokens=200, temperature=0.7, **kwargs):
        return self.llm.create_completion(
            prompt=request,
            max_tokens=max_tokens,
            temperature=temperature,
            grammar=LlamaGrammar(_grammar=json_schema_to_gbnf(kwargs["schema"], kwargs["order"])),
        )
