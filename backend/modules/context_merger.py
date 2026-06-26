from typing import List, Dict, Any, Optional
from modules.local_rag import RetrievedContext
from modules.metadata_search import StructuredMetadata
from models.paper import ExternalPaper
from models.web import WebSearchResult
from models.merger import OptimizedContextItem, MergedContext
import hashlib

class ContextMerger:
    """
    Consolidates data from Local RAG, Metadata Search, External Papers, and Web Search.
    Responsible for deduplication, content ranking, and token-based compression.
    """
    def __init__(self, max_tokens: int = 4000):
        self.max_tokens = max_tokens
        
    def _estimate_tokens(self, text: str) -> int:
        try:
            import tiktoken
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except ImportError:
            # Simple heuristic: ~4 characters per token
            return len(text) // 4
        
    def _normalize_local_rag(self, items: List[RetrievedContext]) -> List[OptimizedContextItem]:
        return [
            OptimizedContextItem(
                content=item.text,
                source_type="LOCAL_RAG",
                citations=item.citations,
                score=item.confidence
            ) for item in items
        ]

    def _normalize_metadata(self, items: List[StructuredMetadata]) -> List[OptimizedContextItem]:
        normalized = []
        for item in items:
            content = f"Paper: {item.paper_id}\nAuthors: {', '.join(item.authors)}\nKeywords: {', '.join(item.keywords)}\nLimitations: {', '.join(item.limitations)}\nFuture Work: {', '.join(item.future_work)}"
            normalized.append(OptimizedContextItem(
                content=content,
                source_type="METADATA",
                citations={"paper_id": item.paper_id, "year": item.publication_year, "conference": item.conference},
                # Normalize arbitrary overlap score to a generic 0.8 to ensure it ranks reasonably
                score=min(1.0, 0.5 + (item.score * 0.1)) 
            ))
        return normalized

    def _normalize_paper(self, items: List[ExternalPaper]) -> List[OptimizedContextItem]:
        normalized = []
        for item in items:
            content = f"Title: {item.title}\nAuthors: {', '.join(item.authors)}\nAbstract: {item.abstract}"
            normalized.append(OptimizedContextItem(
                content=content,
                source_type="PAPER",
                citations={"external_id": item.external_id, "url": item.url, "source": item.source},
                score=0.9 # Default high confidence for structured paper metadata
            ))
        return normalized
        
    def _normalize_web(self, items: List[WebSearchResult]) -> List[OptimizedContextItem]:
        normalized = []
        for item in items:
            content = f"Title: {item.title}\nSnippet: {item.snippet}"
            normalized.append(OptimizedContextItem(
                content=content,
                source_type="WEB",
                citations={"url": item.url, "source": item.source, "date": item.date},
                score=0.7 # Default lower confidence for general web snippets
            ))
        return normalized

    def deduplicate_and_merge(self, 
                              local_rag: Optional[List[RetrievedContext]] = None, 
                              metadata: Optional[List[StructuredMetadata]] = None, 
                              papers: Optional[List[ExternalPaper]] = None, 
                              web: Optional[List[WebSearchResult]] = None) -> MergedContext:
        """
        Merges normalized inputs, deduplicates identical context, ranks them by confidence, 
        and compresses them safely under the total token limit.
        """
        all_items = []
        
        if local_rag:
            all_items.extend(self._normalize_local_rag(local_rag))
        if metadata:
            all_items.extend(self._normalize_metadata(metadata))
        if papers:
            all_items.extend(self._normalize_paper(papers))
        if web:
            all_items.extend(self._normalize_web(web))
            
        # Deduplicate based on MD5 hash of content, keeping the highest score
        seen_items = {}
        
        for item in all_items:
            content_hash = hashlib.md5(item.content.strip().lower().encode()).hexdigest()
            if content_hash not in seen_items:
                seen_items[content_hash] = item
            else:
                if item.score > seen_items[content_hash].score:
                    seen_items[content_hash] = item
                    
        unique_items = list(seen_items.values())
                
        # Rank by score descending
        unique_items.sort(key=lambda x: x.score, reverse=True)
        
        # Compress / Truncate based on max_tokens limit
        final_items = []
        current_tokens = 0
        
        for item in unique_items:
            item_tokens = self._estimate_tokens(item.content)
            
            if current_tokens + item_tokens <= self.max_tokens:
                final_items.append(item)
                current_tokens += item_tokens
            else:
                # Use a greedy knapsack approach to pack smaller contexts if large ones don't fit
                continue
                
        return MergedContext(items=final_items, total_tokens_estimated=current_tokens)
