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

class TavilyProvider(BaseWebSearchProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.tavily.com/search"

    def search(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        import httpx
        headers = {"Content-Type": "application/json"}
        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "basic",
            "max_results": num_results
        }
        with httpx.Client() as client:
            response = client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for r in data.get("results", []):
                results.append(WebSearchResult(
                    title=r.get("title", ""),
                    snippet=r.get("content", ""),
                    url=r.get("url", ""),
                    source="Tavily"
                ))
            return results

    def search_news(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        # Tavily can do news if topic="news"
        import httpx
        headers = {"Content-Type": "application/json"}
        payload = {
            "api_key": self.api_key,
            "query": query,
            "topic": "news",
            "max_results": num_results
        }
        with httpx.Client() as client:
            response = client.post(self.base_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            results = []
            for r in data.get("results", []):
                results.append(WebSearchResult(
                    title=r.get("title", ""),
                    snippet=r.get("content", ""),
                    url=r.get("url", ""),
                    source="Tavily News"
                ))
            return results

class WebSearchService:
    def __init__(self, providers: List[BaseWebSearchProvider]):
        self.providers = providers

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=5))
    def _execute_search_single_provider(self, func, *args, **kwargs):
        return func(*args, **kwargs)

    def _execute_search_with_fallback(self, method_name: str, query: str, num_results: int) -> List[WebSearchResult]:
        last_exception = None
        for provider in self.providers:
            func = getattr(provider, method_name)
            try:
                results = self._execute_search_single_provider(func, query, num_results)
                if results:
                    return results
            except Exception as e:
                logger.warning(f"{provider.__class__.__name__} failed: {e}")
                last_exception = e
        
        if last_exception:
            logger.error("All web search providers failed.")
        return []

    def search_general(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        return self._execute_search_with_fallback("search", query, num_results)

    def search_news(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        return self._execute_search_with_fallback("search_news", query, num_results)

    def search_github(self, query: str, num_results: int = 5) -> List[WebSearchResult]:
        github_query = f"{query} site:github.com"
        return self._execute_search_with_fallback("search", github_query, num_results)

    def search_framework_docs(self, query: str, framework: str, num_results: int = 5) -> List[WebSearchResult]:
        docs_query = f"{query} {framework} documentation"
        return self._execute_search_with_fallback("search", docs_query, num_results)
