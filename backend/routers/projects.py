from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.metadata import ProjectModel

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])

@router.get("")
async def get_projects(db: Session = Depends(get_db)):
    projects = db.query(ProjectModel).all()
    return projects
