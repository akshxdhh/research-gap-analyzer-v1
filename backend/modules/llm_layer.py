import json
from abc import ABC, abstractmethod
from typing import Optional
from models.analyzer import AnalysisOutput
from models.report import ResearchReport

class BaseLLMGenerator(ABC):
    """Abstract base class for final text generation."""
    @abstractmethod
    def generate_structured_json(self, prompt: str, schema: dict) -> dict:
        pass

class OpenAIGenerator(BaseLLMGenerator):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
        except ImportError:
            self.client = None

    def generate_structured_json(self, prompt: str, schema: dict) -> dict:
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

class GeminiGenerator(BaseLLMGenerator):
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.client = genai.GenerativeModel(model)
        except ImportError:
            self.client = None

    def generate_structured_json(self, prompt: str, schema: dict) -> dict:
        if not self.client:
            raise RuntimeError("google-generativeai package is not installed.")
            
        # Standard instruction for JSON payload
        full_prompt = prompt + f"\n\nReturn ONLY a valid JSON object satisfying this schema: {json.dumps(schema)}"
        response = self.client.generate_content(full_prompt)
        text = response.text.strip()
        
        # Clean markdown code blocks if the model hallucinates them
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())


class ReportGeneratorService:
    """
    Takes the structured JSON output from the Research Analyzer and 
    uses an LLM to generate the final human-readable research report sections.
    """
    def __init__(self, llm: BaseLLMGenerator):
        self.llm = llm
        
    def generate_report(self, analysis: AnalysisOutput) -> ResearchReport:
        prompt = f"""
        You are an expert AI Research Scientist.
        Convert the following structured analysis into a professional research report.
        
        CRITICAL RULE: You MUST always cite evidence using the provided citations when making claims.
        CRITICAL RULE: Do not include markdown code block syntax in the final JSON strings.
        
        Analysis Data:
        {analysis.model_dump_json(indent=2)}
        
        Generate the report matching the target JSON schema. Each section should be written as high-quality narrative text.
        """
        
        response_dict = self.llm.generate_structured_json(prompt, ResearchReport.schema())
        return ResearchReport(**response_dict)
