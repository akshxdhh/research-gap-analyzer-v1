import json
from models.merger import MergedContext
from models.analyzer import AnalysisOutput
from core.llm import BaseLLMProvider

class ResearchAnalyzerService:
    """
    Takes merged, deduplicated, and ranked context and performs deep reasoning 
    to extract methodologies, detect contradictions, and infer research gaps.
    Outputs exclusively structured JSON (Pydantic).
    """
    def __init__(self, llm_provider: BaseLLMProvider):
        self.llm = llm_provider
        
    def analyze(self, query: str, context: MergedContext) -> AnalysisOutput:
        """
        Analyzes the consolidated context against the original query to extract 
        key entities and infer novel research gaps.
        """
        # Format the context into a readable string block for the LLM
        context_blocks = []
        for i, item in enumerate(context.items):
            citations_str = json.dumps(item.citations)
            block = f"--- Source [{i+1}] ({item.source_type}) ---\nCitations: {citations_str}\nContent: {item.content}\n"
            context_blocks.append(block)
            
        context_text = "\n".join(context_blocks)
        
        prompt = f"""
        You are an elite AI Research Analyst.
        Based on the provided research context, analyze the findings related to the user query.
        
        Responsibilities:
        1. Extract: Methodologies, Datasets, Metrics, Results, Limitations, Future Work.
        2. Compare papers and explicitly detect any contradictions in results or conclusions.
        3. Detect recurring limitations across multiple sources.
        4. Infer novel research gaps based on the limitations and future work.
        5. Return ONLY structured JSON. DO NOT generate conversational text.
        
        CRITICAL CITATION RULE:
        For `evidence_citations` or any paper citation fields, you MUST ONLY output the exact integer Source ID in brackets, e.g., "[1]" or "[3]". Do NOT output paper titles or URLs.
        
        User Query: "{query}"
        
        Context Data:
        {context_text}
        """
        
        response_dict = self.llm.generate_structured_json(prompt, AnalysisOutput.schema())
        analysis = AnalysisOutput(**response_dict)
        
        # Post-hoc processing: Override naive LLM confidence with actual retrieval scores
        # We parse the "[X]" strings to find the matching context item.
        for gap in analysis.inferred_gaps:
            max_score = 0.0
            valid_citations = []
            for cit in gap.evidence_citations:
                valid_citations.append(cit)
                try:
                    idx = int(cit.replace("[", "").replace("]", "")) - 1
                    if 0 <= idx < len(context.items):
                        max_score = max(max_score, context.items[idx].score)
                except ValueError:
                    pass
            # Base score + max evidence score (normalized 0-1)
            gap.confidence = min(1.0, 0.4 + (max_score * 0.6))
            
        return analysis
