import os

class FileManager:
    def __init__(self, file_path):
        self.file_path = file_path

    def read_file(self):
        if self.file_path is None:
            raise ValueError("File path is not set.")
        if not self.file_exists():
            raise FileNotFoundError(f"The file at {self.file_path} does not exist.")
        with open(self.file_path, 'r') as file:
            content = file.read()
        return content
    
    def overwrite_file(self, data):
        if self.file_path is None:
            raise ValueError("File path is not set.")
        if not self.file_exists():
            raise FileNotFoundError(f"The file at {self.file_path} does not exist.")
        with open(self.file_path, 'w') as file:
            file.write(data)
    
    def write_to_file(self, data):
        if self.file_path is None:
            raise ValueError("File path is not set.")
        if not self.file_exists():
            raise FileNotFoundError(f"The file at {self.file_path} does not exist.")
        with open(self.file_path, 'a') as file:
            file.write(data)
    
    def file_exists(self):
        if self.file_path is None:
            raise ValueError("File path is not set.")
        if os.path.isfile(self.file_path):
            return True
        return False