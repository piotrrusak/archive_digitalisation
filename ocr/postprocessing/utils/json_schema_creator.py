from copy import deepcopy

"""
This class creates dict in json schema format based on properties required by document. (https://json-schema.org/draft/2020-12/json-schema-core)
"""

class JsonSchemaCreator:
    def __init__(self):
        self.schema = {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False
        }
    
    def create_information_schema(self, input_name: list, input_type: list, **kwargs) -> tuple[dict, list]:
        result_schema = deepcopy(self.schema)
        result_order = []

        if "not_required" in kwargs.keys():
            not_required = kwargs["not_required"]
        else:
            not_required = set()

        if len(input_name) != len(input_type):
            raise ValueError("input_name and input_type length is not same")
        
        for i in range(len(input_name)):
            result_order.append(input_name[i])
            result_schema["properties"][input_name[i]] = {"type": input_type[i]}
            if input_name[i] not in not_required:
                result_schema["required"].append(input_name[i])
        return result_schema, result_order
    
    def create_certainity_schema(self, input_name: list) -> tuple[dict, list]:
        result_schema = deepcopy(self.schema)
        result_order = []

        for name in input_name:
            certainity_property_name = "Pewność " + name
            result_order.append(certainity_property_name)
            result_schema["properties"][certainity_property_name] = {"type": "integer"}
            result_schema["required"].append(certainity_property_name)
        return result_schema, result_order

    def create_list_schema(self) -> tuple[dict, list]:
        result_schema = deepcopy(self.schema)
        result_order = []

        result_schema["properties"]["lines"] = {
            "type": "array",
            "items": {
                "type": "string"
            }
        }

        result_order.append("lines")

        return result_schema, result_order