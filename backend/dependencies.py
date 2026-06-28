from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from config import settings
from core.llm import GroqLLMProvider, GeminiLLMProvider
from database import get_db
from modules.query_understanding import QueryUnderstandingService
from modules.planner import PlannerAgent
from modules.context_merger import ContextMerger
from modules.research_analyzer import ResearchAnalyzerService
from modules.llm_layer import ReportGeneratorService
from modules.report_exporter import ReportExporter
from modules.embeddings_service import BGEProvider, EmbeddingService
from modules.hybrid_ranker import HybridRanker
from modules.local_rag import LocalRAGOrchestrator
from modules.metadata_search import MetadataSearchService
from modules.paper_search import ArxivProvider, OpenAlexProvider, PaperSearchService, SemanticScholarProvider

from modules.vector_db.keyword_repo import BM25KeywordRepository
from modules.vector_search import VectorSearchService
from modules.web_search import DuckDuckGoProvider, TavilyProvider, WebSearchService

def get_llm_provider():
    if settings.groq_api_key:
        return GroqLLMProvider(api_key=settings.groq_api_key, model=settings.groq_model)
    elif settings.gemini_api_key:
        return GeminiLLMProvider(api_key=settings.gemini_api_key, model=settings.gemini_model)
    else:
        raise HTTPException(status_code=503, detail="Neither GROQ_API_KEY nor GEMINI_API_KEY is configured.")

def get_query_understanding_service() -> QueryUnderstandingService:
    return QueryUnderstandingService(llm_provider=get_llm_provider())

def get_planner_agent() -> PlannerAgent:
    return PlannerAgent(llm_provider=get_llm_provider())

def get_context_merger() -> ContextMerger:
    return ContextMerger(max_tokens=settings.context_max_tokens)

def get_research_analyzer() -> ResearchAnalyzerService:
    return ResearchAnalyzerService(llm_provider=get_llm_provider())

def get_report_generator() -> ReportGeneratorService:
    return ReportGeneratorService(llm=get_llm_provider())

def get_report_exporter() -> ReportExporter:
    return ReportExporter()


def get_embedding_service() -> EmbeddingService:
    return EmbeddingService(provider=BGEProvider(model_name=settings.embedding_model_name))


def get_vector_search_service() -> VectorSearchService:
    if settings.qdrant_url and settings.qdrant_api_key:
        from modules.vector_db.qdrant_repo import QdrantRepository
        vector_db = QdrantRepository(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )
    else:
        from modules.vector_db.chroma_repo import ChromaRepository
        import logging
        logging.getLogger(__name__).warning("Qdrant config missing, falling back to local ChromaDB.")
        vector_db = ChromaRepository(persist_directory="./chroma_db")
        
    return VectorSearchService(vector_db=vector_db, embedding_service=get_embedding_service())


def get_keyword_repository() -> BM25KeywordRepository:
    return BM25KeywordRepository(index_dir=settings.bm25_index_dir)


def get_local_rag() -> LocalRAGOrchestrator:
    return LocalRAGOrchestrator(
        vector_search=get_vector_search_service(),
        keyword_search=get_keyword_repository(),
        hybrid_ranker=HybridRanker(),
    )


def get_metadata_search_service(db: Session = Depends(get_db)) -> MetadataSearchService:
    return MetadataSearchService(db_session=db)


def get_paper_search_service() -> PaperSearchService:
    providers = [
        SemanticScholarProvider(api_key=settings.semantic_scholar_api_key),
        ArxivProvider(),
        OpenAlexProvider(),
    ]
    return PaperSearchService(providers=providers)


def get_web_search_service() -> WebSearchService:
    providers = []
    if settings.tavily_api_key:
        providers.append(TavilyProvider(api_key=settings.tavily_api_key))
    providers.append(DuckDuckGoProvider())
    return WebSearchService(providers=providers)
