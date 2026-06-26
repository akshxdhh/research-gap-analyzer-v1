from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class SearchResult:
    def __init__(self, id: str, text: str, score: float, metadata: Dict[str, Any]):
        self.id = id
        self.text = text
        self.score = score
        self.metadata = metadata

class BaseVectorRepository(ABC):
    """
    Interface for Vector Database repositories.
    """
    
    @abstractmethod
    def insert(self, collection_name: str, ids: List[str], vectors: List[List[float]], texts: List[str], metadata: List[Dict[str, Any]]) -> bool:
        """Inserts embeddings and their associated text/metadata into the database."""
        pass

    @abstractmethod
    def delete(self, collection_name: str, ids: List[str]) -> bool:
        """Deletes specific embeddings by ID from a collection."""
        pass

    @abstractmethod
    def search(self, collection_name: str, query_vector: List[float], top_k: int = 5, filter_dict: Optional[Dict[str, Any]] = None) -> List[SearchResult]:
        """Searches for similar vectors with optional metadata filtering."""
        pass

    @abstractmethod
    def delete_collection(self, collection_name: str) -> bool:
        """Deletes an entire collection/namespace."""
        pass
