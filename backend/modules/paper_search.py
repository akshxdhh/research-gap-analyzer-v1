import time
import httpx
import hashlib
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential
from models.paper import ExternalPaper

import xml.etree.ElementTree as ET

class BasePaperProvider(ABC):
    """Abstract base class for paper search providers."""
    
    @abstractmethod
    def search(self, query: str, page: int = 1, page_size: int = 10) -> List[ExternalPaper]:
        pass


class SemanticScholarProvider(BasePaperProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = "https://api.semanticscholar.org/graph/v1/paper/search"
        
    def search(self, query: str, page: int = 1, page_size: int = 10) -> List[ExternalPaper]:
        offset = (page - 1) * page_size
        headers = {}
        if self.api_key:
            headers["x-api-key"] = self.api_key
            
        params = {
            "query": query,
            "offset": offset,
            "limit": page_size,
            "fields": "paperId,title,authors,abstract,url,year,venue"
        }
        
        with httpx.Client() as client:
            response = client.get(self.base_url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            papers = []
            for item in data.get("data", []):
                authors = [a.get("name", "") for a in item.get("authors", [])]
                papers.append(ExternalPaper(
                    title=item.get("title", ""),
                    authors=authors,
                    abstract=item.get("abstract", "") or "",
                    url=item.get("url"),
                    year=item.get("year"),
                    venue=item.get("venue"),
                    source="Semantic Scholar",
                    external_id=item.get("paperId", "")
                ))
            return papers


class ArxivProvider(BasePaperProvider):
    def __init__(self):
        self.base_url = "http://export.arxiv.org/api/query"
        
    def search(self, query: str, page: int = 1, page_size: int = 10) -> List[ExternalPaper]:
        start = (page - 1) * page_size
        params = {
            "search_query": f"all:{query}",
            "start": start,
            "max_results": page_size
        }
        
        with httpx.Client() as client:
            response = client.get(self.base_url, params=params)
            response.raise_for_status()
            
            root = ET.fromstring(response.text)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            
            papers = []
            for entry in root.findall("atom:entry", ns):
                title = entry.find("atom:title", ns).text.replace("\n", " ").strip() if entry.find("atom:title", ns) is not None else ""
                abstract = entry.find("atom:summary", ns).text.replace("\n", " ").strip() if entry.find("atom:summary", ns) is not None else ""
                url = entry.find("atom:id", ns).text if entry.find("atom:id", ns) is not None else ""
                
                authors = []
                for author in entry.findall("atom:author", ns):
                    name = author.find("atom:name", ns).text
                    if name:
                        authors.append(name)
                        
                published = entry.find("atom:published", ns)
                year = int(published.text[:4]) if published is not None and published.text else None
                
                # ArXiv ID is usually the end of the URL
                ext_id = url.split("/")[-1] if url else ""
                
                papers.append(ExternalPaper(
                    title=title,
                    authors=authors,
                    abstract=abstract,
                    url=url,
                    year=year,
                    venue="arXiv",
                    source="arXiv",
                    external_id=ext_id
                ))
            return papers


class OpenAlexProvider(BasePaperProvider):
    def __init__(self, email: str = "research@example.com"):
        self.email = email
        self.base_url = "https://api.openalex.org/works"
        
    def search(self, query: str, page: int = 1, page_size: int = 10) -> List[ExternalPaper]:
        params = {
            "search": query,
            "page": page,
            "per-page": page_size,
            "mailto": self.email
        }
        
        with httpx.Client() as client:
            response = client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            papers = []
            for item in data.get("results", []):
                authors = [a.get("author", {}).get("display_name", "") for a in item.get("authorships", [])]
                papers.append(ExternalPaper(
                    title=item.get("title", ""),
                    authors=authors,
                    abstract=str(item.get("abstract_inverted_index", "") or ""),
                    url=item.get("doi") or item.get("id"),
                    year=item.get("publication_year"),
                    venue=item.get("primary_location", {}).get("source", {}).get("display_name", ""),
                    source="OpenAlex",
                    external_id=str(item.get("id", ""))
                ))
            return papers


class PaperSearchService:
    """
    Orchestrates search across multiple external paper providers with caching, 
    rate limiting, and resilient retry logic.
    """
    def __init__(self, providers: List[BasePaperProvider]):
        self.providers = providers
        self._cache = {}
        # Rate limit delay in seconds (simple implementation for cross-provider rate limiting)
        self.rate_limit_delay = 1.0 

    def _get_cache_key(self, provider_name: str, query: str, page: int) -> str:
        raw_key = f"{provider_name}_{query}_{page}"
        return hashlib.md5(raw_key.encode()).hexdigest()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _execute_search_with_retry(self, provider: BasePaperProvider, query: str, page: int, page_size: int):
        return provider.search(query, page, page_size)

    def search(self, query: str, page: int = 1, page_size: int = 10) -> List[ExternalPaper]:
        """
        Executes a paginated search across all registered providers, aggregates the results, 
        and normalizes them into the unified ExternalPaper model.
        """
        all_papers = []
        
        for provider in self.providers:
            provider_name = provider.__class__.__name__
            cache_key = self._get_cache_key(provider_name, query, page)
            
            if cache_key in self._cache:
                all_papers.extend(self._cache[cache_key])
                continue
                
            try:
                # Respect rate limits before hitting external API
                time.sleep(self.rate_limit_delay)
                
                # Execute with resilience
                papers = self._execute_search_with_retry(provider, query, page, page_size)
                
                # Cache results
                self._cache[cache_key] = papers
                all_papers.extend(papers)
                
            except Exception as e:
                # Log failure but continue with other providers
                import logging
                logging.getLogger(__name__).warning(f"Provider {provider_name} failed: {e}")
                
        return all_papers
