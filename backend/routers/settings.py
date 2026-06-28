from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.metadata import SettingsModel
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

class SettingsResponse(BaseModel):
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_avatar: Optional[str] = None
    user_organization: Optional[str] = None
    user_research_interests: List[str] = []
    
    app_theme: str = "system"
    app_default_report_format: str = "pdf"
    app_default_citation_style: str = "apa"
    app_default_llm: str = "llama3-70b-8192"
    app_retrieval_depth: int = 5
    app_search_provider_priority: List[str] = ["semantic_scholar", "arxiv", "openalex"]
    
    ai_preferred_model: str = "llama3-70b-8192"
    ai_temperature: float = 0.2
    ai_max_tokens: int = 4000
    ai_context_size: int = 8192
    
    notif_upload_completed: int = 1
    notif_analysis_completed: int = 1
    notif_report_generated: int = 1

@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SettingsModel).filter(SettingsModel.id == "default").first()
    if not settings:
        settings = SettingsModel(id="default")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("", response_model=SettingsResponse)
def update_settings(updates: SettingsResponse, db: Session = Depends(get_db)):
    settings = db.query(SettingsModel).filter(SettingsModel.id == "default").first()
    if not settings:
        settings = SettingsModel(id="default")
        db.add(settings)
    
    for key, value in updates.model_dump().items():
        setattr(settings, key, value)
        
    db.commit()
    db.refresh(settings)
    return settings
