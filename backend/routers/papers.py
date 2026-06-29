from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.metadata import PaperModel

router = APIRouter(prefix="/api/v1/papers", tags=["Papers"])

@router.get("")
async def get_papers(
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(get_db)
):
    total = db.query(PaperModel).count()
    papers = db.query(PaperModel).order_by(PaperModel.upload_date.desc()).offset(offset).limit(limit).all()
    return {
        "items": papers,
        "total": total,
        "limit": limit,
        "offset": offset
    }
