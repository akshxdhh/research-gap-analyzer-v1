from fastapi import APIRouter
from models.api_models import StatusResponse

router = APIRouter(prefix="/api/v1/status", tags=["Status"])

@router.get("/", response_model=StatusResponse)
async def get_status():
    return StatusResponse(
        status="ok",
        version="1.0.0",
        services={
            "llm": "available",
            "vector_db": "connected",
            "web_search": "available",
            "metadata_search": "connected"
        }
    )
