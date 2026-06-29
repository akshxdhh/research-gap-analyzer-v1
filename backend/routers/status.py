import os
import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from models.api_models import StatusResponse
from services.health_service import HealthCheckService
import redis.asyncio as aioredis

router = APIRouter(prefix="/api/v1/status", tags=["Status"])

async def job_status_generator(request: Request) -> AsyncGenerator[str, None]:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis = aioredis.from_url(redis_url)
    pubsub = redis.pubsub()
    await pubsub.subscribe("job_status")
    
    try:
        while True:
            if await request.is_disconnected():
                break
                
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message is not None:
                data = message["data"].decode("utf-8")
                yield f"data: {data}\n\n"
            else:
                # Keep-alive
                yield f": keep-alive\n\n"
    finally:
        await pubsub.unsubscribe("job_status")
        await redis.close()

@router.get("/stream")
async def stream_job_status(request: Request):
    """Streams real-time job status updates via Server-Sent Events."""
    return StreamingResponse(job_status_generator(request), media_type="text/event-stream")

@router.get("", response_model=StatusResponse)
async def get_status():
    """Returns cached health status immediately. Triggers background refresh if cache is stale."""
    status_data = await HealthCheckService.get_status_cached()
    return StatusResponse(**status_data)

@router.post("/refresh", response_model=StatusResponse)
async def refresh_status():
    """Forces a blocking fresh health check."""
    status_data = await HealthCheckService.refresh_status()
    return StatusResponse(**status_data)
