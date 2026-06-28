from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from .base import BaseVectorRepository, SearchResult

class QdrantRepository(BaseVectorRepository):
    def __init__(self, url: str, api_key: str, vector_size: int = 384):
        if not url or not api_key:
            import logging
            logging.getLogger(__name__).warning("QDRANT_URL and QDRANT_API_KEY missing. Vector search will be disabled.")
            self.client = None
        else:
            self.client = QdrantClient(url=url, api_key=api_key)
        self.vector_size = vector_size

    def _ensure_collection_exists(self, collection_name: str):
        if not self.client:
            return
        try:
            collections = self.client.get_collections().collections
            if not any(c.name == collection_name for c in collections):
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=rest.VectorParams(
                        size=self.vector_size,
                        distance=rest.Distance.COSINE
                    )
                )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to ensure Qdrant collection exists: {e}")

    def insert(self, collection_name: str, ids: List[str], vectors: List[List[float]], texts: List[str], metadata: List[Dict[str, Any]]) -> bool:
        if not self.client:
            return False
            
        self._ensure_collection_exists(collection_name)
        
        points = []
        for i in range(len(ids)):
            payload = metadata[i].copy() if metadata[i] else {}
            payload["text"] = texts[i]
            points.append(rest.PointStruct(
                id=ids[i],
                vector=vectors[i],
                payload=payload
            ))
            
        try:
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            return True
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Qdrant insert failed: {e}")
            return False

    def delete(self, collection_name: str, ids: List[str]) -> bool:
        if not self.client:
            return False
            
        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=rest.PointIdsList(
                    points=ids,
                ),
            )
            return True
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Qdrant delete failed: {e}")
            return False

    def search(self, collection_name: str, query_vector: List[float], top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[SearchResult]:
        if not self.client:
            return []
            
        query_filter = None
        if filter_dict:
            # Construct a basic exact match filter for Qdrant
            must_conditions = [
                rest.FieldCondition(
                    key=key,
                    match=rest.MatchValue(value=value)
                ) for key, value in filter_dict.items()
            ]
            query_filter = rest.Filter(must=must_conditions)

        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=top_k
            )
            
            search_results = []
            for res in results:
                text = res.payload.pop("text", "") if res.payload else ""
                search_results.append(SearchResult(
                    id=str(res.id),
                    text=text,
                    score=res.score,
                    metadata=res.payload or {}
                ))
                
            return search_results
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Qdrant search failed: {e}")
            return []

    def delete_collection(self, collection_name: str) -> bool:
        if not self.client:
            return False
        try:
            return self.client.delete_collection(collection_name=collection_name)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Qdrant delete_collection failed: {e}")
            return False
