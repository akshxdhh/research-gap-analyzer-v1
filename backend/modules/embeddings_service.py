from abc import ABC, abstractmethod
from typing import List
import hashlib
import json
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class BaseEmbeddingProvider(ABC):
    """Interface for embedding providers."""
    
    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        pass

class BGEProvider(BaseEmbeddingProvider):
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        # In a real app, initialize HuggingFaceBgeEmbeddings here
        
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        # Mock implementation
        logger.info(f"BGEProvider generating embeddings for {len(texts)} texts.")
        return [[0.1, 0.2, 0.3] for _ in texts]

class OpenAIProvider(BaseEmbeddingProvider):
    def __init__(self, api_key: str, model_name: str = "text-embedding-3-small"):
        self.api_key = api_key
        self.model_name = model_name
        
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        # Mock implementation
        logger.info(f"OpenAIProvider generating embeddings for {len(texts)} texts.")
        return [[0.4, 0.5, 0.6] for _ in texts]

class NomicProvider(BaseEmbeddingProvider):
    def __init__(self, api_key: str, model_name: str = "nomic-embed-text-v1.5"):
        self.api_key = api_key
        self.model_name = model_name
        
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        # Mock implementation
        logger.info(f"NomicProvider generating embeddings for {len(texts)} texts.")
        return [[0.7, 0.8, 0.9] for _ in texts]

class EmbeddingService:
    def __init__(self, provider: BaseEmbeddingProvider, batch_size: int = 100):
        self.provider = provider
        self.batch_size = batch_size
        self._cache = {} # Simple in-memory cache

    def _get_hash(self, text: str) -> str:
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _execute_with_retry(self, batch: List[str]) -> List[List[float]]:
        return self.provider.embed_batch(batch)

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embeds a list of documents using batching, caching, and retries.
        """
        results = [None] * len(texts)
        texts_to_embed = []
        indices_to_embed = []

        # 1. Check Cache
        for i, text in enumerate(texts):
            h = self._get_hash(text)
            if h in self._cache:
                results[i] = self._cache[h]
            else:
                texts_to_embed.append(text)
                indices_to_embed.append(i)

        # 2. Process in batches
        for i in range(0, len(texts_to_embed), self.batch_size):
            batch_texts = texts_to_embed[i:i + self.batch_size]
            batch_indices = indices_to_embed[i:i + self.batch_size]
            
            # 3. Retry wrapper
            batch_embeddings = self._execute_with_retry(batch_texts)
            
            # 4. Store in cache & results
            for text, idx, embedding in zip(batch_texts, batch_indices, batch_embeddings):
                self._cache[self._get_hash(text)] = embedding
                results[idx] = embedding

        return results
