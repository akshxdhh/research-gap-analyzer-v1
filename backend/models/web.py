from typing import Optional
from pydantic import BaseModel

class WebSearchResult(BaseModel):
    """
    Unified model representing a result fetched from the web
    (e.g., News, GitHub repos, Blogs, Framework Docs).
    """
    title: str
    snippet: str
    url: str
    source: str
    date: Optional[str] = None
