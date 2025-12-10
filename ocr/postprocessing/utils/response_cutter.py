class ResponseCutter:
    """
    Llama response format: ("usage" is only in last yielded response. when streaming is off,
    there is only one response.) (there is only one choice so index is always 0)

    {
        "id": completion_id,
        "object": "text_completion",
        "created": created,
        "model": model_name,
        "choices": [
            {
                "text": text_str,
                "index": 0,
                "logprobs": logprobs_or_none,
                "finish_reason": finish_reason,
            }
        ],
        "usage": {
            "prompt_tokens": len(prompt_tokens),
            "completion_tokens": len(completion_tokens),
            "total_tokens": len(prompt_tokens) + len(completion_tokens),
        },
    }
    """

    def __init__(self):
        pass

    def get_response_text(self, response):
        return response["choices"][0]["text"]

    def get_finish_reason(self, response):
        return response["choices"][0]["finish_reason"]
