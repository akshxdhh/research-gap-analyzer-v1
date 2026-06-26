from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/gaps", tags=["Gaps"])

@router.get("/")
async def get_gaps():
    return []
