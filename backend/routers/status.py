from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from config import settings
from models.api_models import StatusResponse

router = APIRouter(prefix="/api/v1/status", tags=["Status"])

@router.get("", response_model=StatusResponse)
async def get_status(db: Session = Depends(get_db)):
    services = {}
    
    # 1. Database Check
    try:
        db.execute(text("SELECT 1"))
        services["database"] = "connected"
    except Exception as e:
        services["database"] = f"error: {str(e)}"
        
    # 2. Redis Check
    try:
        if settings.redis_url:
            import redis
            r = redis.Redis.from_url(settings.redis_url)
            r.ping()
            services["redis"] = "connected"
        else:
            services["redis"] = "not_configured"
    except Exception as e:
        services["redis"] = f"error: {str(e)}"
        
    # 3. Qdrant Check
    try:
        if settings.qdrant_url and settings.qdrant_api_key:
            from qdrant_client import QdrantClient
            client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
            client.get_collections()
            services["vector_db"] = "connected (qdrant)"
        else:
            services["vector_db"] = "local fallback (chromadb)"
    except Exception as e:
        services["vector_db"] = f"error: {str(e)}"
        
    # 4. Supabase Check
    try:
        if settings.supabase_url and settings.supabase_key:
            from modules.cloud_storage import SupabaseStorage
            storage = SupabaseStorage()
            storage.supabase.storage.list_buckets()
            services["cloud_storage"] = "connected (supabase)"
        else:
            services["cloud_storage"] = "local fallback (temp files)"
    except Exception as e:
        services["cloud_storage"] = f"error: {str(e)}"
        
    # 5. LLM Check
    if settings.groq_api_key:
        services["llm"] = "configured (groq)"
    elif settings.gemini_api_key:
        services["llm"] = "configured (gemini)"
    else:
        services["llm"] = "not_configured"
        
    return StatusResponse(
        status="ok" if all(v.startswith("connected") or v.startswith("configured") or v.startswith("local") for v in services.values()) else "degraded",
        version="1.0.0",
        services=services
    )
