from typing import List, Dict, Any, Optional
from models.chunk import Chunk
from modules.vector_db.base import BaseVectorRepository, SearchResult
from modules.embeddings_service import EmbeddingService

class VectorSearchService:
    def __init__(self, vector_db: BaseVectorRepository, embedding_service: EmbeddingService):
        self.vector_db = vector_db
        self.embedding_service = embedding_service

    def _normalize_score(self, score: float) -> float:
        """
        Normalizes distance/score to a [0, 1] range.
        Assuming ChromaDB's default L2 distance (where 0 is identical), 
        we convert distance to similarity using 1 / (1 + distance).
        (If the DB natively returns cosine similarity [0, 1], this logic can be adjusted per DB)
        """
        # Ensure score is non-negative
        score = max(0.0, score)
        return 1.0 / (1.0 + score)

    def search(self, query: str, collection_name: str, top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[SearchResult]:
        """
        Performs vector search for a single query.
        """
        query_vector = self.embedding_service.embed_documents([query])[0]
        
        raw_results = self.vector_db.search(
            collection_name=collection_name, 
            query_vector=query_vector, 
            top_k=top_k, 
            filter_dict=filter_dict
        )
        
        for res in raw_results:
            res.score = self._normalize_score(res.score)
            
        raw_results.sort(key=lambda x: x.score, reverse=True)
        return raw_results

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
        vectors = self.embedding_service.embed_documents(texts)
        return self.vector_db.insert(
            collection_name=collection_name,
            ids=ids,
            vectors=vectors,
            texts=texts,
            metadata=metadata,
        )

    def batch_search(self, queries: List[str], collection_name: str, top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[List[SearchResult]]:
        """
        Performs vector search for multiple queries concurrently/efficiently.
        """
        query_vectors = self.embedding_service.embed_documents(queries)
        
        batch_results = []
        for qv in query_vectors:
            raw_results = self.vector_db.search(
                collection_name=collection_name,
                query_vector=qv,
                top_k=top_k,
                filter_dict=filter_dict
            )
            
            for res in raw_results:
                res.score = self._normalize_score(res.score)
                
            raw_results.sort(key=lambda x: x.score, reverse=True)
            batch_results.append(raw_results)
            
        return batch_results
