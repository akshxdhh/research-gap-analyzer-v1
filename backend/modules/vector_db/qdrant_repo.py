from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from .base import BaseVectorRepository, SearchResult

class QdrantRepository(BaseVectorRepository):
    def __init__(self, host: str = "localhost", port: int = 6333, vector_size: int = 384):
        self.client = QdrantClient(host=host, port=port)
        self.vector_size = vector_size

    def _ensure_collection_exists(self, collection_name: str):
        collections = self.client.get_collections().collections
        if not any(c.name == collection_name for c in collections):
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=rest.VectorParams(
                    size=self.vector_size,
                    distance=rest.Distance.COSINE
                )
            )

    def insert(self, collection_name: str, ids: List[str], vectors: List[List[float]], texts: List[str], metadata: List[Dict[str, Any]]) -> bool:
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
            
        self.client.upsert(
            collection_name=collection_name,
            points=points
        )
        return True

    def delete(self, collection_name: str, ids: List[str]) -> bool:
        self.client.delete(
            collection_name=collection_name,
            points_selector=rest.PointIdsList(
                points=ids,
            ),
        )
        return True

    def search(self, collection_name: str, query_vector: List[float], top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[SearchResult]:
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

    def delete_collection(self, collection_name: str) -> bool:
        return self.client.delete_collection(collection_name=collection_name)
