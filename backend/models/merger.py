from typing import List, Dict, Any
from pydantic import BaseModel

class OptimizedContextItem(BaseModel):
    content: str
    source_type: str  # e.g., "LOCAL_RAG", "METADATA", "PAPER", "WEB"
    citations: Dict[str, Any]
    score: float

class MergedContext(BaseModel):
    items: List[OptimizedContextItem]
    total_tokens_estimated: int
