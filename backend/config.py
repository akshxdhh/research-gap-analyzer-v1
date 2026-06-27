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

    database_url: str = "postgresql+psycopg://research:research@localhost:5432/research_gap"
    redis_url: str = "redis://localhost:6379/0"

    groq_api_key: Optional[str] = None
    groq_model: str = "llama3-70b-8192"

    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-1.5-flash"

    semantic_scholar_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

    chroma_host: str = "localhost"
    chroma_port: int = 8001
    chroma_persist_directory: str = "./chroma_db"
    vector_collection_name: str = "research_papers"

    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    embedding_model_name: str = "BAAI/bge-small-en-v1.5"
    bm25_index_dir: str = "./whoosh_index"

    upload_dir: str = "./uploads"
    temp_dir: str = "./temp"
    max_upload_bytes: int = 25 * 1024 * 1024
    context_max_tokens: int = 4000

    cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:3000"])

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
