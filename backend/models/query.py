from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class IntentType(str, Enum):
    LITERATURE_REVIEW = "LITERATURE_REVIEW"
    GAP_ANALYSIS = "GAP_ANALYSIS"
    SPECIFIC_QA = "SPECIFIC_QA"
    BROAD_EXPLORATION = "BROAD_EXPLORATION"
    METHODOLOGY_COMPARISON = "METHODOLOGY_COMPARISON"
    UNKNOWN = "UNKNOWN"

class QueryFilters(BaseModel):
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    authors: Optional[List[str]] = None
    conferences: Optional[List[str]] = None

class QueryUnderstandingOutput(BaseModel):
    intent: IntentType = Field(description="The primary intent of the user's query.")
    keywords: List[str] = Field(description="Extracted keywords from the query.")
    entities: List[str] = Field(description="Extracted specific entities (models, datasets, frameworks).")
    domain: str = Field(description="The detected research domain.")
    objective: str = Field(description="The determined overall user objective.")
    filters: QueryFilters = Field(description="Any extracted filters (years, authors).")
    planner_instructions: List[str] = Field(description="Actionable instructions for the downstream Planner.")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0.")
