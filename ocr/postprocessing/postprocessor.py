from ocr.postprocessing.utils.query_creator import QueryCreator
from ocr.postprocessing.utils.response_cutter import ResponseCutter
from ocr.postprocessing.utils.json_schema_creator import JsonSchemaCreator
import json
from ocr.postprocessing.model.gemma3 import Gemma3

class Postprocessor:
    def __init__(self):
        self.query_creator = QueryCreator("Jesteś pomocnym asystentem, który poprawia tekst wyekstrahowany z obrazu.")
        self.response_cutter = ResponseCutter()
        self.json_schema_creator = JsonSchemaCreator()
        self.model = Gemma3()

    def postprocess(self, lines: list[str]):

        schema, order = self.json_schema_creator.create_list_schema()

        query = self.query_creator.create_query_with_context(
            """
            Popraw podane linie tekstu wyekstrahowane z obrazu.
            Poprawiaj tylko błędy OCR (literówki, błędne słowa), zachowując oryginalny sens.

            Zasady obowiązkowe:
            -Nie zmieniaj kolejności linii.
            -Nie usuwaj żadnych linii.
            -Nie dodawaj żadnych nowych znaków ani prefiksów (np. >>, -, numerów, cudzysłowów), chyba że są częścią poprawy treści.
            -Zwróć wynik dokładnie w tej samej strukturze: lines = [ ... ]
            -Każda linia wejściowa odpowiada jednej poprawionej linii wyjściowej.
            """
            , context=str(lines))

        response = self.response_cutter.get_response_text(self.model(query, schema=json.dumps(schema), order=order))
        
        return json.loads(response)