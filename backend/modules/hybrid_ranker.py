import math
from typing import List, Optional
from modules.vector_db.base import SearchResult

class HybridRanker:
    def __init__(self, cross_encoder_model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initializes the Hybrid Ranker with a Cross-Encoder for deep semantic re-ranking.
        Loads the model lazily or immediately based on implementation needs.
        """
        self.cross_encoder_model_name = cross_encoder_model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            # We import here to avoid heavy PyTorch initialization if the class is just instantiated without use.
            from sentence_transformers import CrossEncoder
            self._model = CrossEncoder(self.cross_encoder_model_name)
        return self._model

    def merge_and_rerank(self, query: str, bm25_results: List[SearchResult], vector_results: List[SearchResult], top_k: int = 5) -> List[SearchResult]:
        """
        Merges results from BM25 and Vector Search, deduplicates them, reranks them using a 
        Cross-Encoder, applies confidence scoring, and returns the top-K chunks.
        """
        # 1. Deduplicate by ID
        unique_results = {}
        
        # We append vector results first, then bm25. 
        # Since dictionaries preserve insertion order or override, this cleanly deduplicates.
        for res in vector_results + bm25_results:
            if res.id not in unique_results:
                # Store a copy to avoid mutating the original objects passed in
                import copy
                unique_results[res.id] = copy.deepcopy(res)
                
        candidate_results = list(unique_results.values())
        if not candidate_results:
            return []

        # 2. Cross Encoder Reranking
        cross_inp = [[query, res.text] for res in candidate_results]
        model = self._get_model()
        
        # The model returns logits for each pair
        scores = model.predict(cross_inp)
        
        # 3. Confidence scoring
        for idx, res in enumerate(candidate_results):
            # Apply Sigmoid to convert raw logits to a [0, 1] confidence probability
            try:
                confidence = 1 / (1 + math.exp(-scores[idx]))
            except OverflowError:
                # Math overflow handling for extremely negative scores
                confidence = 0.0
                
            res.score = confidence

        # 4. Sort descending by the new confidence score
        candidate_results.sort(key=lambda x: x.score, reverse=True)
        
        # 5. Return Final Retrieval (Top K)
        return candidate_results[:top_k]
