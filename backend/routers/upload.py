import os
import uuid
import tempfile
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
from modules.cloud_storage import SupabaseStorage

router = APIRouter(prefix="/api/v1/upload", tags=["Upload"])

@router.post("", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Uploads a PDF, creates a database entry, and enqueues a background task for processing.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid MIME type. Must be application/pdf.")

    file_id = str(uuid.uuid4())
    safe_filename = Path(file.filename).name
    
    try:
        # Save to temporary file for chunking
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_path = tmp_file.name
        total = 0
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > settings.max_upload_bytes:
                tmp_file.close()
                os.unlink(temp_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="PDF exceeds maximum upload size.",
                )
            tmp_file.write(chunk)
        tmp_file.close()

        # Database transaction
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
            cloud_url=None,
            chunk_count=0,
            processing_status="queued",
            processing_progress=0.0
        )
        db.add(paper)
        db.commit()
        
        # Enqueue background task
        from tasks import process_document_task
        process_document_task.delay(file_id, temp_path, safe_filename)
        
        return UploadResponse(
            message="File uploaded and queued for processing.",
            file_id=file_id,
            chunk_count=0
        )
    except HTTPException:
        db.rollback()
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise
    except Exception as e:
        db.rollback()
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))
