from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.metadata import ResearchGapModel

router = APIRouter(prefix="/api/v1/gaps", tags=["Gaps"])

@router.get("")
async def get_gaps(
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(get_db)
):
    total = db.query(ResearchGapModel).count()
    gaps = db.query(ResearchGapModel).order_by(ResearchGapModel.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "items": gaps,
        "total": total,
        "limit": limit,
        "offset": offset
    }
