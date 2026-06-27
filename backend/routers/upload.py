import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from dependencies import get_local_rag
from models.api_models import UploadResponse
from models.metadata import PaperModel, ProjectModel
from modules.chunking import PDFProcessor
from modules.local_rag import LocalRAGOrchestrator

router = APIRouter(prefix="/api/v1/upload", tags=["Upload"])

@router.post("/", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    local_rag: LocalRAGOrchestrator = Depends(get_local_rag),
    db: Session = Depends(get_db),
):
    """
    Uploads a PDF, chunks it using the semantic PDFProcessor, 
    and theoretically sends to the Local RAG DB.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid MIME type. Must be application/pdf.")

    os.makedirs(settings.upload_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    safe_filename = Path(file.filename).name
    file_path = os.path.join(settings.upload_dir, f"{file_id}.pdf")
    
    try:
        with open(file_path, "wb") as buffer:
            total = 0
            while chunk := file.file.read(1024 * 1024):
                total += len(chunk)
                if total > settings.max_upload_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="PDF exceeds maximum upload size.",
                    )
                buffer.write(chunk)
            
        processor = PDFProcessor()
        chunks = processor.process_pdf(file_path, paper_id=file_id)
        local_rag.index_chunks(chunks, collection_name=settings.vector_collection_name)

        project = db.get(ProjectModel, "default")
        if project is None:
            project = ProjectModel(id="default", name="Default Project", status="active")
            db.add(project)

        paper = PaperModel(
            id=file_id,
            project_id="default",
            title=Path(safe_filename).stem,
            authors=[],
            year=None,
            filename=safe_filename,
            storage_path=file_path,
            chunk_count=len(chunks),
        )
        db.add(paper)
        db.commit()
        
        return UploadResponse(
            message="File uploaded and chunked successfully.",
            file_id=file_id,
            chunk_count=len(chunks)
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
