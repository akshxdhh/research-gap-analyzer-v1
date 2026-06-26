from typing import List, Optional
from pydantic import BaseModel

class ExternalPaper(BaseModel):
    """
    Unified model representing a research paper fetched from an external source 
    (Semantic Scholar, arXiv, CORE, etc.)
    """
    title: str
    authors: List[str]
    abstract: str
    url: Optional[str] = None
    year: Optional[int] = None
    venue: Optional[str] = None
    source: str
    external_id: str
