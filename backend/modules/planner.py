import uuid
from typing import Any
from models.query import QueryUnderstandingOutput
from models.planner import ExecutionPlan
from core.llm import BaseLLMProvider

class PlannerAgent:
    """
    The Planner Agent receives the structured output from Query Understanding 
    and uses an LLM to dynamically generate an ExecutionPlan.
    It decides which tools to call (Local RAG, Metadata, Paper Search, Web Search), 
    the execution order, fallback logic, and retries. 
    It DOES NOT execute the retrieval itself.
    """
    def __init__(self, llm_provider: BaseLLMProvider):
        self.llm = llm_provider
        
    def generate_plan(self, query_understanding: QueryUnderstandingOutput) -> ExecutionPlan:
        prompt = f"""
        You are the Planner Agent for a Research Gap Analyzer system.
        Based on the following query understanding output, determine the optimal retrieval execution plan.
        
        Available Tools:
        - LOCAL_RAG: Semantic & BM25 hybrid search over local chunked PDFs.
        - METADATA_SEARCH: SQL search over structured paper metadata (authors, keywords, year).
        - PAPER_SEARCH: External paper API search (Semantic Scholar, arXiv, CORE).
        - WEB_SEARCH: General web search for latest news, GitHub, or framework docs.
        
        Query Understanding Output:
        Intent: {query_understanding.intent}
        Keywords: {query_understanding.keywords}
        Entities: {query_understanding.entities}
        Filters: {query_understanding.filters.dict()}
        Planner Instructions: {query_understanding.planner_instructions}
        
        Generate a step-by-step ExecutionPlan.
        For each step specify the tool, query, parameters, dependencies, fallback tool, and retry count.
        Provide your reasoning for this specific execution plan.
        """
        
        response_dict = self.llm.generate_structured_json(prompt, ExecutionPlan.model_json_schema())
        # Override plan_id dynamically to ensure uniqueness rather than relying on LLM hallucination
        response_dict["plan_id"] = str(uuid.uuid4())
        return ExecutionPlan(**response_dict)
