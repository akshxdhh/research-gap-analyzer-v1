from abc import ABC, abstractmethod
from typing import List
import hashlib
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
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError as exc:
                raise RuntimeError("sentence-transformers package is not installed.") from exc
            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        logger.info(f"BGEProvider generating embeddings for {len(texts)} texts.")
        embeddings = self._get_model().encode(
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return [embedding.tolist() for embedding in embeddings]

class EmbeddingService:
    def __init__(self, provider: BaseEmbeddingProvider, batch_size: int = 100):
        self.provider = provider
        self.batch_size = batch_size
        self._cache = {}

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
