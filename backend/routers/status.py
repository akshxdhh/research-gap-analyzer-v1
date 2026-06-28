from fastapi import APIRouter
from models.api_models import StatusResponse
from services.health_service import HealthCheckService

router = APIRouter(prefix="/api/v1/status", tags=["Status"])

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
