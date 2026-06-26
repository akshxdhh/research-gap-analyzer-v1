from typing import List, Optional
from abc import ABC, abstractmethod
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential
from models.web import WebSearchResult
import logging

logger = logging.getLogger(__name__)

class BaseWebSearchProvider(ABC):
    @abstractmethod
    def search(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        pass

    @abstractmethod
    def search_news(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        pass

class DuckDuckGoProvider(BaseWebSearchProvider):
    def __init__(self):
        try:
            from duckduckgo_search import DDGS
            self.ddgs = DDGS()
        except ImportError:
            self.ddgs = None
            logger.warning("duckduckgo_search package is not installed. Web Search will fail.")

    def search(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        if not self.ddgs:
            raise RuntimeError("duckduckgo_search not installed.")
        
        results = []
        for r in self.ddgs.text(query, max_results=num_results):
            results.append(WebSearchResult(
                title=r.get("title", ""),
                snippet=r.get("body", ""),
                url=r.get("href", ""),
                source="DuckDuckGo Search"
            ))
        return results

    def search_news(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        if not self.ddgs:
            raise RuntimeError("duckduckgo_search not installed.")
            
        results = []
        for r in self.ddgs.news(query, max_results=num_results):
            results.append(WebSearchResult(
                title=r.get("title", ""),
                snippet=r.get("body", ""),
                url=r.get("url", ""),
                date=r.get("date", ""),
                source="DuckDuckGo News"
            ))
        return results

class WebSearchService:
    def __init__(self, provider: BaseWebSearchProvider):
        self.provider = provider

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _execute_search(self, func, *args, **kwargs):
        return func(*args, **kwargs)

    def search_general(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        """General web search for blogs and recent research."""
        return self._execute_search(self.provider.search, query, num_results)

    def search_news(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        """Search the latest AI news."""
        return self._execute_search(self.provider.search_news, query, num_results)

    def search_github(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        """Search for GitHub repositories specifically."""
        github_query = f"{query} site:github.com"
        return self._execute_search(self.provider.search, github_query, num_results)

    def search_framework_docs(self, query: str, framework: str, num_results: int = 5) -> List[WebSearchResult]:
        """Search specific framework documentation (e.g. PyTorch, LangChain)."""
        docs_query = f"{query} {framework} documentation"
        return self._execute_search(self.provider.search, docs_query, num_results)
