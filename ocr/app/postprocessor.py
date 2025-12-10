import json
from copy import deepcopy

from postprocessing_models_wrappers.gemma3 import Gemma3

INITIAL_PROMPT = "Jesteś pomocnym asystentem, który poprawia tekst wyekstrahowany z obrazu."
INITIAL_SCHEMA = {"type": "object", "properties": {}, "required": [], "additionalProperties": False}

def create_list_schema() -> tuple[dict, list]:
    result_schema = deepcopy(INITIAL_SCHEMA)
    result_order = []

    result_schema["properties"]["lines"] = {"type": "array", "items": {"type": "string"}}

    result_order.append("lines")

    return result_schema, result_order

def create_query_with_context(user_input, context):
    query = f"<start_of_turn>user\n{INITIAL_PROMPT}\n<end_of_turn>\n \
        <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\nThis is context: {context}\n<end_of_turn>\n \
        <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\n{user_input}\n<end_of_turn>\n<start_of_turn>model"
    return query

def postprocess(lines: list[str]):
    model = Gemma3()

    schema, order = create_list_schema()

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

    response = model(query, schema=json.dumps(schema), order=order)["choices"][0]["text"]

    return json.loads(response)