from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models.metadata import PaperMetadataModel

class MetadataSearchParams(BaseModel):
    authors: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    methodologies: Optional[List[str]] = None
    datasets: Optional[List[str]] = None
    metrics: Optional[List[str]] = None
    limitations: Optional[List[str]] = None
    future_work: Optional[List[str]] = None
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    conference: Optional[str] = None
    
class StructuredMetadata(BaseModel):
    paper_id: str
    authors: List[str]
    keywords: List[str]
    methodologies: List[str]
    datasets: List[str]
    metrics: List[str]
    limitations: List[str]
    future_work: List[str]
    publication_year: Optional[int]
    conference: Optional[str]
    score: float

class MetadataSearchService:
    def __init__(self, db_session: Session):
        self.db = db_session
        
    def _calculate_overlap_score(self, query_list: Optional[List[str]], db_list: List[str]) -> float:
        if not query_list or not db_list:
            return 0.0
        # Simple Jaccard-like or intersection size scoring.
        query_set = set(q.lower() for q in query_list)
        db_set = set(d.lower() for d in db_list)
        intersection = len(query_set.intersection(db_set))
        return float(intersection)

    def search(self, params: MetadataSearchParams, top_k: int = 10) -> List[StructuredMetadata]:
        # Base query
        query = self.db.query(PaperMetadataModel)
        
        # Hard filters (Scalars)
        if params.year_min is not None:
            query = query.filter(PaperMetadataModel.publication_year >= params.year_min)
        if params.year_max is not None:
            query = query.filter(PaperMetadataModel.publication_year <= params.year_max)
        if params.conference is not None:
            query = query.filter(PaperMetadataModel.conference == params.conference)
            
        is_postgres = False
        if self.db.bind and self.db.bind.dialect.name == "postgresql":
            is_postgres = True
            
        if is_postgres:
            from sqlalchemy import func
            # Example using Postgres native array overlap to pre-filter
            # Note: We still calculate exact score in Python for simplicity,
            # but we can filter down to candidates that match AT LEAST ONE keyword
            # if we cast the JSON field to jsonb and use the ?| operator.
            if params.keywords:
                query = query.filter(func.jsonb_exists_any(PaperMetadataModel.keywords, params.keywords))
            
        candidates = query.limit(1000).all() # Put an absolute limit to prevent OOM
        
        # Soft filters / Ranking (Arrays)
        results = []
        for c in candidates:
            score = 0.0
            
            # Score bumps for overlaps in array fields
            score += self._calculate_overlap_score(params.authors, c.authors) * 2.0
            score += self._calculate_overlap_score(params.keywords, c.keywords) * 1.5
            score += self._calculate_overlap_score(params.methodologies, c.methodologies) * 1.0
            score += self._calculate_overlap_score(params.datasets, c.datasets) * 1.0
            score += self._calculate_overlap_score(params.metrics, c.metrics) * 1.0
            score += self._calculate_overlap_score(params.limitations, c.limitations) * 1.0
            score += self._calculate_overlap_score(params.future_work, c.future_work) * 1.0
            
            results.append(StructuredMetadata(
                paper_id=c.paper_id,
                authors=c.authors or [],
                keywords=c.keywords or [],
                methodologies=c.methodologies or [],
                datasets=c.datasets or [],
                metrics=c.metrics or [],
                limitations=c.limitations or [],
                future_work=c.future_work or [],
                publication_year=c.publication_year,
                conference=c.conference,
                score=score
            ))
            
        # Sort descending by score, then sort ascending by year as a tie-breaker (optional).
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results[:top_k]
