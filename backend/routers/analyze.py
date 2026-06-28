from fastapi import APIRouter, Depends, HTTPException
from models.api_models import AnalyzeRequest
from models.analyzer import AnalysisOutput
from models.merger import MergedContext
from dependencies import (
    get_query_understanding_service,
    get_planner_agent,
    get_context_merger,
    get_research_analyzer,
    get_web_search_service,
    get_paper_search_service
)
from modules.query_understanding import QueryUnderstandingService
from modules.planner import PlannerAgent
from modules.context_merger import ContextMerger
from modules.research_analyzer import ResearchAnalyzerService
from modules.web_search import WebSearchService
from modules.paper_search import PaperSearchService
from modules.metadata_search import MetadataSearchService

router = APIRouter(prefix="/api/v1/analyze", tags=["Analysis"])

@router.post("", response_model=AnalysisOutput)
async def analyze_query(
    request: AnalyzeRequest,
    qu_service: QueryUnderstandingService = Depends(get_query_understanding_service),
    planner: PlannerAgent = Depends(get_planner_agent),
    merger: ContextMerger = Depends(get_context_merger),
    analyzer: ResearchAnalyzerService = Depends(get_research_analyzer),
    web_search: WebSearchService = Depends(get_web_search_service),
    paper_search: PaperSearchService = Depends(get_paper_search_service)
):
    """
    Main orchestration endpoint.
    1. Understands the query
    2. Plans the search execution
    3. Mocks the execution of searches for now (or runs them if connected)
    4. Merges context
    5. Analyzes for gaps and contradictions
    """
    try:
        # 1. Query Understanding
        qu_output = qu_service.analyze_query(request.query)
        
        # 2. Planning
        execution_plan = planner.generate_plan(qu_output)
        
        # 3. Execution (Sequential or Concurrent)
        
        web_results = []
        paper_results = []
        
        from fastapi.concurrency import run_in_threadpool
        
        def execute_tool(tool_name: str, query: str):
            if tool_name == "WEB_SEARCH":
                return web_search.search(query, max_results=2)
            elif tool_name == "PAPER_SEARCH":
                # Mocking paper search for speed, or run real
                return paper_search.search(query, providers=["arxiv"])
            return []

        import asyncio
        
        async def process_step(step):
            success = False
            results = []
            final_tool = step.tool
            
            # Retry loop
            for attempt in range(step.retry_count + 1):
                try:
                    results = await run_in_threadpool(execute_tool, step.tool, step.query)
                    if results:
                        success = True
                        break
                except Exception as e:
                    print(f"Error executing {step.tool}: {e}")
            
            # Fallback
            if not success and step.fallback_tool:
                final_tool = step.fallback_tool
                try:
                    results = await run_in_threadpool(execute_tool, step.fallback_tool, step.query)
                except Exception as e:
                    print(f"Error executing fallback {step.fallback_tool}: {e}")
                    
            return final_tool, results

        tasks = [process_step(step) for step in execution_plan.steps]
        step_outputs = await asyncio.gather(*tasks)
        
        for tool, results in step_outputs:
            if tool == "WEB_SEARCH":
                web_results.extend(results)
            elif tool == "PAPER_SEARCH":
                paper_results.extend(results)
                
        # 4. Context Merging
        merged_context = merger.deduplicate_and_merge(web=web_results, papers=paper_results)
        
        # 5. Research Analysis
        analysis = analyzer.analyze(request.query, merged_context)
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
