import os
from typing import Generator
from fastapi import Request
from modules.query_understanding import QueryUnderstandingService
from core.llm import OpenAILLMProvider, GroqLLMProvider
from database import get_db
from modules.planner import PlannerAgent
from modules.context_merger import ContextMerger
from modules.research_analyzer import ResearchAnalyzerService
from modules.llm_layer import ReportGeneratorService, OpenAIGenerator
from modules.report_exporter import ReportExporter

def get_llm_provider():
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        return GroqLLMProvider(api_key=groq_key, model=os.environ.get("GROQ_MODEL", "llama3-70b-8192"))
    
    openai_key = os.environ.get("OPENAI_API_KEY", "dummy-key-for-testing")
    return OpenAILLMProvider(api_key=openai_key)

def get_query_understanding_service() -> QueryUnderstandingService:
    return QueryUnderstandingService(llm_provider=get_llm_provider())

def get_planner_agent() -> PlannerAgent:
    return PlannerAgent(llm_provider=get_llm_provider())

def get_context_merger() -> ContextMerger:
    return ContextMerger(max_tokens=4000)

def get_research_analyzer() -> ResearchAnalyzerService:
    return ResearchAnalyzerService(llm_provider=get_llm_provider())

def get_report_generator() -> ReportGeneratorService:
    # Fallback to OpenAIGenerator implementation (which natively works with Groq base URL via the wrapper if we adapt it)
    # Actually, we can reuse the same provider logic!
    llm = get_llm_provider()
    # The ReportGeneratorService expects a BaseLLMGenerator which is compatible with BaseLLMProvider
    return ReportGeneratorService(llm=llm)

def get_report_exporter() -> ReportExporter:
    return ReportExporter()
