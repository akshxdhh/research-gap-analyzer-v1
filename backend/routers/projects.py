from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

@router.get("/")
async def get_projects():
    return [{"id": "1", "name": "Default Project"}]
