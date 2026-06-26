from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/papers", tags=["Papers"])

@router.get("/")
async def get_papers():
    return []
