import json

try :
    from app.postprocessing_models_wrappers.gemma3 import Gemma3
except Exception :
    try :
        from postprocessing_models_wrappers.gemma3 import Gemma3
    except Exception as e:
        raise ImportError("Failed to import Gemma3 model wrapper. Ensure the package structure is correct.") from e


INITIAL_PROMPT = "Jesteś pomocnym asystentem, który poprawia tekst wyekstrahowany z obrazu."

def create_query_with_context(user_input: str, context: str):
    query = f"<start_of_turn>user\n{INITIAL_PROMPT}\n<end_of_turn>\n \
        <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\nThis is context: {context}\n<end_of_turn>\n \
        <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\n{user_input}\n<end_of_turn>\n<start_of_turn>model"
    return query

def postprocess(lines: list[str]):
    model = Gemma3()

    query = create_query_with_context(
        """
        Popraw podane linie tekstu wyekstrahowane z obrazu.
        Poprawiaj tylko błędy OCR (literówki, błędne słowa), zachowując oryginalny sens.

        Zasady obowiązkowe:
        -Nie zmieniaj kolejności linii.
        -Nie usuwaj żadnych linii.
        -Nie dodawaj żadnych nowych znaków ani prefiksów (np. >>, -, numerów, cudzysłowów),
        chyba że są częścią poprawy treści.
        -Zwróć wynik dokładnie w tej samej strukturze: lines = [ ... ]
        -Każda linia wejściowa odpowiada jednej poprawionej linii wyjściowej.
        """,
        context=str(lines),
    )

    schema = {
        "type": "object",
        "properties": {
            "lines": {
                "type": "array",
                "items": {"type": "string"}
            }
        },
        "required": [
            "lines"
        ],
        "additionalProperties": False
    }
    order = ["lines"]

    response = model(query, schema=json.dumps(schema), order=order)["choices"][0]["text"]

    return json.loads(response)