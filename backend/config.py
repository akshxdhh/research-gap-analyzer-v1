import logging
from functools import lru_cache
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Research Gap Analyzer"
    environment: str = "development"
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://user:password@hostname/dbname"
    redis_url: str = ""

    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"

    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-1.5-flash"

    semantic_scholar_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    openalex_email: Optional[str] = None

    qdrant_url: Optional[str] = None
    qdrant_api_key: Optional[str] = None
    vector_collection_name: str = "research_papers"

    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    supabase_storage_bucket: str = "research_gap_pdfs"

    embedding_model_name: str = "BAAI/bge-small-en-v1.5"
    bm25_index_dir: str = "./whoosh_index"

    temp_dir: str = "./temp"
    max_upload_bytes: int = 25 * 1024 * 1024
    context_max_tokens: int = 4000

    cors_origins: List[str] = Field(default_factory=lambda: ["*"])

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
