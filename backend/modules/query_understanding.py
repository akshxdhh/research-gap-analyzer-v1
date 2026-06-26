import json
from typing import Any
from models.query import QueryUnderstandingOutput
from core.llm import BaseLLMProvider

class QueryUnderstandingService:
    def __init__(self, llm_provider: BaseLLMProvider):
        self.llm = llm_provider
        
    def analyze_query(self, raw_query: str) -> QueryUnderstandingOutput:
        """
        Analyzes the user's natural language query and extracts structured routing 
        and planning information using an LLM.
        """
        prompt = f"""
        Analyze the following research query and extract the structured components.
        
        Responsibilities:
        1. Intent classification (LITERATURE_REVIEW, GAP_ANALYSIS, SPECIFIC_QA, BROAD_EXPLORATION, METHODOLOGY_COMPARISON)
        2. Keyword extraction
        3. Entity extraction (models, datasets, frameworks)
        4. Research domain detection
        5. Determine the user's objective
        6. Extract any explicit filters (years, authors, conferences)
        7. Generate step-by-step instructions for the downstream Agent Planner.
        
        Query: "{raw_query}"
        """
        
        # In a real implementation with LangChain/OpenAI, we would pass the Pydantic schema natively.
        response_dict = self.llm.generate_structured_json(prompt, QueryUnderstandingOutput.schema())
        return QueryUnderstandingOutput(**response_dict)
