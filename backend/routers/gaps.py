from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.metadata import ResearchGapModel

router = APIRouter(prefix="/api/v1/gaps", tags=["Gaps"])

@router.get("/")
async def get_gaps(db: Session = Depends(get_db)):
    gaps = db.query(ResearchGapModel).order_by(ResearchGapModel.created_at.desc()).all()
    return gaps
