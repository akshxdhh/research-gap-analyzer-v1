from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum

class ToolName(str, Enum):
    LOCAL_RAG = "LOCAL_RAG"
    METADATA_SEARCH = "METADATA_SEARCH"
    PAPER_SEARCH = "PAPER_SEARCH"
    WEB_SEARCH = "WEB_SEARCH"

class PlannedStep(BaseModel):
    step_id: int
    tool: ToolName
    query: str
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameters specific to the tool")
    depends_on: List[int] = Field(default_factory=list, description="Step IDs that must complete before this step")
    fallback_tool: Optional[ToolName] = Field(default=None, description="Tool to run if this step fails or returns no results")
    retry_count: int = Field(default=1, description="Number of times to retry this step if it fails")

class ExecutionPlan(BaseModel):
    plan_id: str
    steps: List[PlannedStep]
    reasoning: str = Field(description="The LLM's reasoning for generating this specific plan")
