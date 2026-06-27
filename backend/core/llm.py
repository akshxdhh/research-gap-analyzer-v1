from abc import ABC, abstractmethod
import json
import re
from typing import Any

class BaseLLMProvider(ABC):
    """Interface for LLM execution."""
    @abstractmethod
    def generate_structured_json(self, prompt: str, schema: Any) -> dict:
        raise NotImplementedError

class GeminiLLMProvider(BaseLLMProvider):
    """Gemini-backed structured JSON provider."""

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required for LLM execution.")

        try:
            import google.generativeai as genai
        except ImportError as exc:
            raise RuntimeError("google-generativeai package is not installed.") from exc

        genai.configure(api_key=api_key)
        self.client = genai.GenerativeModel(model)

    def _extract_json(self, text: str) -> dict:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
            if not match:
                raise
            return json.loads(match.group(0))

    def generate_structured_json(self, prompt: str, schema: Any) -> dict:
        full_prompt = (
            f"{prompt}\n\n"
            "Return only valid JSON. The JSON must satisfy this schema exactly:\n"
            f"{json.dumps(schema)}"
        )
        response = self.client.generate_content(
            full_prompt,
            generation_config={"response_mime_type": "application/json"},
        )
        return self._extract_json(response.text)


class GroqLLMProvider(BaseLLMProvider):
    """Groq-backed structured JSON provider."""

    def __init__(self, api_key: str, model: str = "llama3-70b-8192"):
        if not api_key:
            raise ValueError("GROQ_API_KEY is required for LLM execution.")

        try:
            from groq import Groq
        except ImportError as exc:
            raise RuntimeError("groq package is not installed.") from exc

        self.client = Groq(api_key=api_key)
        self.model = model

    def _extract_json(self, text: str) -> dict:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
            if not match:
                raise
            return json.loads(match.group(0))

    def generate_structured_json(self, prompt: str, schema: Any) -> dict:
        full_prompt = (
            f"{prompt}\n\n"
            "Return ONLY a valid JSON object. Do not include markdown formatting or explanation. The JSON must satisfy this schema exactly:\n"
            f"{json.dumps(schema)}"
        )
        
        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": full_prompt,
                }
            ],
            model=self.model,
            response_format={"type": "json_object"},
        )
        
        return self._extract_json(chat_completion.choices[0].message.content)
