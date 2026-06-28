import json
import logging
from typing import Any, Callable, Optional

from config import settings

logger = logging.getLogger(__name__)

class RedisCacheManager:
    def __init__(self):
        self.redis = None
        self._memory_fallback = {}
        
        if settings.redis_url:
            try:
                import redis
                # upstash redis urls usually start with rediss:// or redis://
                self.redis = redis.Redis.from_url(
                    settings.redis_url, 
                    decode_responses=True,
                    socket_connect_timeout=3,
                    socket_timeout=3,
                    retry_on_timeout=True
                )
                self.redis.ping()
                logger.info("Connected to Redis successfully.")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis, falling back to in-memory cache. Error: {e}")
                self.redis = None

    def get(self, key: str) -> Optional[Any]:
        if self.redis:
            try:
                val = self.redis.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
                
        return self._memory_fallback.get(key)

    def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> None:
        if self.redis:
            try:
                self.redis.setex(key, ttl_seconds, json.dumps(value))
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")
                
        self._memory_fallback[key] = value

    def clear(self):
        if self.redis:
            try:
                self.redis.flushdb()
            except Exception as e:
                logger.warning(f"Redis clear failed: {e}")
        self._memory_fallback.clear()

cache_manager = RedisCacheManager()

def with_cache(key_prefix: str, ttl: int = 3600):
    """
    Decorator to cache function results.
    """
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            # Create a simple deterministic cache key
            key_parts = [key_prefix]
            key_parts.extend([str(a) for a in args])
            key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            cache_key = ":".join(key_parts)
            
            cached = cache_manager.get(cache_key)
            if cached is not None:
                return cached
                
            result = func(*args, **kwargs)
            if result:
                cache_manager.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator
