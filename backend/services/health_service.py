import asyncio
import time
from sqlalchemy import text
from database import SessionLocal
from config import settings

class HealthCheckService:
    _cache = None
    _cache_time = 0
    CACHE_TTL = 30  # seconds
    
    @classmethod
    async def get_status_cached(cls):
        """Returns cached status if valid, otherwise triggers a background refresh and returns unknown/stale."""
        current_time = time.time()
        
        # If cache is valid, return it
        if cls._cache and (current_time - cls._cache_time < cls.CACHE_TTL):
            return cls._cache
            
        # If no cache at all, run synchronously so first load isn't completely blind
        if not cls._cache:
            return await cls.refresh_status()
            
        # If cache is stale, trigger background refresh and return stale cache for now
        asyncio.create_task(cls.refresh_status())
        return cls._cache

    @classmethod
    async def refresh_status(cls):
        """Runs all health checks concurrently and updates the cache."""
        
        # We use asyncio.gather to run blocking I/O calls concurrently in thread pools
        results = await asyncio.gather(
            cls._check_database(),
            cls._check_redis(),
            cls._check_qdrant(),
            cls._check_supabase(),
            cls._check_llm(),
            return_exceptions=True
        )
        
        services = {
            "database": results[0] if not isinstance(results[0], Exception) else f"error: {str(results[0])}",
            "redis": results[1] if not isinstance(results[1], Exception) else f"error: {str(results[1])}",
            "vector_db": results[2] if not isinstance(results[2], Exception) else f"error: {str(results[2])}",
            "cloud_storage": results[3] if not isinstance(results[3], Exception) else f"error: {str(results[3])}",
            "llm": results[4] if not isinstance(results[4], Exception) else f"error: {str(results[4])}",
        }
        
        is_ok = all(
            isinstance(v, str) and (v.startswith("connected") or v.startswith("configured") or v.startswith("local"))
            for v in services.values()
        )
        
        overall_status = "ok" if is_ok else "degraded"
        
        # Structured log
        print(f"\n--- Health Check ---")
        for k, v in services.items():
            print(f"{k.ljust(15)} : {v}")
        print(f"Overall Status  : {overall_status}")
        print(f"--------------------\n")
        
        response = {
            "status": overall_status,
            "version": "1.0.0",
            "services": services
        }
        
        # Update cache
        cls._cache = response
        cls._cache_time = time.time()
        
        return response

    @staticmethod
    async def _check_database():
        def _check():
            db = SessionLocal()
            try:
                db.execute(text("SELECT 1"))
                return "connected"
            finally:
                db.close()
        return await asyncio.wait_for(asyncio.to_thread(_check), timeout=2.0)

    @staticmethod
    async def _check_redis():
        def _check():
            if settings.redis_url:
                import redis
                r = redis.Redis.from_url(settings.redis_url)
                r.ping()
                return "connected"
            return "not_configured"
        return await asyncio.wait_for(asyncio.to_thread(_check), timeout=2.0)

    @staticmethod
    async def _check_qdrant():
        def _check():
            if settings.qdrant_url and settings.qdrant_api_key:
                from qdrant_client import QdrantClient
                client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
                client.get_collections()
                return "connected (qdrant)"
            return "local fallback (chromadb)"
        return await asyncio.wait_for(asyncio.to_thread(_check), timeout=3.0)

    @staticmethod
    async def _check_supabase():
        def _check():
            if settings.supabase_url and settings.supabase_key:
                from modules.cloud_storage import SupabaseStorage
                storage = SupabaseStorage()
                storage.supabase.storage.list_buckets()
                return "connected (supabase)"
            return "local fallback (temp files)"
        return await asyncio.wait_for(asyncio.to_thread(_check), timeout=3.0)

    @staticmethod
    async def _check_llm():
        def _check():
            if settings.groq_api_key:
                return "configured (groq)"
            elif settings.gemini_api_key:
                return "configured (gemini)"
            return "not_configured"
        return await asyncio.to_thread(_check)
