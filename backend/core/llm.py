import json
from abc import ABC, abstractmethod
from typing import Any

class BaseLLMProvider(ABC):
    """Interface for LLM execution."""
    @abstractmethod
    def generate_structured_json(self, prompt: str, schema: Any) -> dict:
        raise NotImplementedError

class OpenAILLMProvider(BaseLLMProvider):
    """
    OpenAI implementation utilizing strict structured outputs (json_schema)
    to guarantee Pydantic schema adherence without ValidationError crashes.
    """
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
        except ImportError:
            self.client = None

    def generate_structured_json(self, prompt: str, schema: Any) -> dict:
        if not self.client:
            raise RuntimeError("openai package is not installed.")
            
        json_schema = {
            "name": "response_schema",
            "strict": True,
            "schema": schema
        }

        if "additionalProperties" not in json_schema["schema"]:
            json_schema["schema"]["additionalProperties"] = False

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that strictly outputs JSON matching the requested schema."},
                {"role": "user", "content": prompt}
            ],
            response_format={
                "type": "json_schema", 
                "json_schema": json_schema
            }
        )
        return json.loads(response.choices[0].message.content)

class GroqLLMProvider(BaseLLMProvider):
    """
    Groq implementation utilizing json_object.
    """
    def __init__(self, api_key: str, model: str = "llama3-70b-8192"):
        self.api_key = api_key
        self.model = model
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
        except ImportError:
            self.client = None

    def generate_structured_json(self, prompt: str, schema: Any) -> dict:
        if not self.client:
            raise RuntimeError("openai package is not installed.")
            
        full_prompt = prompt + f"\n\nYou MUST return ONLY a valid JSON object satisfying this exact schema: {json.dumps(schema)}"
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that strictly outputs valid JSON."},
                {"role": "user", "content": full_prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
