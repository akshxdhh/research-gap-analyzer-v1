from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.metadata import PaperModel

router = APIRouter(prefix="/api/v1/papers", tags=["Papers"])

@router.get("")
async def get_papers(db: Session = Depends(get_db)):
    papers = db.query(PaperModel).order_by(PaperModel.upload_date.desc()).all()
    return papers
