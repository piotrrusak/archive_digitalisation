from ocr.postprocessing.utils.file_manager import FileManager


class QueryCreator:
    def __init__(self, system_prompt, **kwargs):
        if "file_path" in kwargs.keys():
            self.file_manager = FileManager(file_path=kwargs["context_path"])
        else:
            self.file_manager = FileManager(file_path=None)
        self.system_prompt = system_prompt

    def create_query(self, user_input):
        query = f"<start_of_turn>user\n{self.system_prompt}\n<end_of_turn>\n \
            <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\n{user_input}\n<end_of_turn>\n<start_of_turn>model"
        return query

    def create_query_with_context(self, user_input, context):
        query = f"<start_of_turn>user\n{self.system_prompt}\n<end_of_turn>\n \
            <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\nThis is context: {context}\n<end_of_turn>\n \
            <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\n{user_input}\n<end_of_turn>\n<start_of_turn>model"
        return query

    def create_query_with_context_from_file(self, user_input, **kwargs):
        base_context_path = self.file_manager.file_path

        if "context_path" in kwargs.keys():
            self.file_manager.file_path = kwargs["context_path"]

        context = self.file_manager.read_file()
        query = f"<start_of_turn>user\n{self.system_prompt}\n<end_of_turn>\n \
            <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\nThis is context: {context}\n<end_of_turn>\n \
            <start_of_turn>model\n<end_of_turn>\n<start_of_turn>user\n{user_input}\n<end_of_turn>\n<start_of_turn>model"

        self.file_manager.file_path = base_context_path
        return query
