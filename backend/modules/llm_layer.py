import json
from models.analyzer import AnalysisOutput
from models.report import ResearchReport
from core.llm import BaseLLMProvider

class ReportGeneratorService:
    """
    Takes the structured JSON output from the Research Analyzer and 
    uses an LLM to generate the final human-readable research report sections.
    """
    def __init__(self, llm: BaseLLMProvider):
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
        
        response_dict = self.llm.generate_structured_json(prompt, ResearchReport.model_json_schema())
        return ResearchReport(**response_dict)
