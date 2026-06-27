from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from models.chunk import Chunk
from modules.vector_search import VectorSearchService
from modules.vector_db.keyword_repo import BM25KeywordRepository
from modules.hybrid_ranker import HybridRanker

class RetrievedContext(BaseModel):
    text: str
    citations: Dict[str, Any]
    confidence: float

class LocalRAGOrchestrator:
    def __init__(self, 
                 vector_search: VectorSearchService, 
                 keyword_search: BM25KeywordRepository, 
                 hybrid_ranker: HybridRanker):
        self.vector_search = vector_search
        self.keyword_search = keyword_search
        self.hybrid_ranker = hybrid_ranker

    def index_chunks(self, chunks: List[Chunk], collection_name: str) -> bool:
        if not chunks:
            return True

        ids = [chunk.id for chunk in chunks]
        texts = [chunk.text for chunk in chunks]
        metadata = [
            {
                "paper_id": chunk.metadata.paper_id,
                "page_number": chunk.metadata.page_number,
                "section": chunk.metadata.section,
                **chunk.metadata.extra_metadata,
            }
            for chunk in chunks
        ]
        self.vector_search.index_chunks(chunks, collection_name)
        self.keyword_search.insert(ids=ids, texts=texts, metadata=metadata)
        return True

    def retrieve(self, query: str, collection_name: str, top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[RetrievedContext]:
        """
        Coordinates the retrieval process across BM25 and Vector DB without calling external APIs.
        Fuses the results via the Hybrid Ranker.
        """
        # 1. Fetch from Vector DB
        vector_results = self.vector_search.search(
            query=query, 
            collection_name=collection_name, 
            top_k=top_k, 
            filter_dict=filter_dict
        )
        
        # 2. Fetch from BM25 Keyword Index
        keyword_results = self.keyword_search.search(
            query_str=query, 
            top_k=top_k, 
            filter_dict=filter_dict
        )
        
        # 3. Fuse and Rerank
        final_results = self.hybrid_ranker.merge_and_rerank(
            query=query, 
            bm25_results=keyword_results, 
            vector_results=vector_results, 
            top_k=top_k
        )
        
        # 4. Format Output
        formatted_context = []
        for res in final_results:
            formatted_context.append(RetrievedContext(
                text=res.text,
                citations=res.metadata,
                confidence=res.score
            ))
            
        return formatted_context
