import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
from .base import BaseVectorRepository, SearchResult

class ChromaRepository(BaseVectorRepository):
    def __init__(self, persist_directory: str = "./chroma_db", host: str = None, port: int = None):
        if host and port:
            self.client = chromadb.HttpClient(host=host, port=port)
        else:
            self.client = chromadb.PersistentClient(path=persist_directory)

    def _get_or_create_collection(self, collection_name: str):
        return self.client.get_or_create_collection(name=collection_name)

    def insert(self, collection_name: str, ids: List[str], vectors: List[List[float]], texts: List[str], metadata: List[Dict[str, Any]]) -> bool:
        collection = self._get_or_create_collection(collection_name)
        collection.upsert(
            ids=ids,
            embeddings=vectors,
            documents=texts,
            metadatas=metadata
        )
        return True

    def delete(self, collection_name: str, ids: List[str]) -> bool:
        collection = self._get_or_create_collection(collection_name)
        collection.delete(ids=ids)
        return True

    def search(self, collection_name: str, query_vector: List[float], top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[SearchResult]:
        collection = self._get_or_create_collection(collection_name)
        
        # Chroma expects the filter in a specific format, we pass it as 'where'
        results = collection.query(
            query_embeddings=[query_vector],
            n_results=top_k,
            where=filter_dict
        )
        
        search_results = []
        if results['ids'] and len(results['ids']) > 0:
            for i in range(len(results['ids'][0])):
                # Chroma distances are typically returned (e.g. L2)
                # We invert it to a similarity score so higher is better
                distance = results['distances'][0][i] if 'distances' in results and results['distances'] else 0.0
                score = 1.0 / (1.0 + distance)
                search_results.append(SearchResult(
                    id=results['ids'][0][i],
                    text=results['documents'][0][i] if results['documents'] else "",
                    score=score,
                    metadata=results['metadatas'][0][i] if results['metadatas'] else {}
                ))
                
        return search_results

    def delete_collection(self, collection_name: str) -> bool:
        try:
            self.client.delete_collection(name=collection_name)
            return True
        except ValueError:
            return False
