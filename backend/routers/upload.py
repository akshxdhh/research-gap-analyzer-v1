import os
import uuid
import tempfile
import hashlib
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Path as FastAPIPath
from sqlalchemy.orm import Session
import fitz # PyMuPDF

from config import settings
from database import get_db
from models.api_models import UploadResponse
from models.metadata import PaperModel, ProjectModel

router = APIRouter(prefix="/api/v1/upload", tags=["Upload"])

@router.post("", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Uploads a PDF, creates a database entry, and enqueues a background task for processing.
    Validates file format, size, corruption, and duplicates.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid MIME type. Must be application/pdf.")

    file_id = str(uuid.uuid4())
    safe_filename = Path(file.filename).name
    
    try:
        # Save to temporary file for validation and chunking
        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_path = tmp_file.name
        
        hasher = hashlib.sha256()
        total_size = 0
        
        while chunk := await file.read(1024 * 1024):
            total_size += len(chunk)
            if total_size > settings.max_upload_bytes:
                tmp_file.close()
                os.unlink(temp_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"PDF exceeds maximum upload size of {settings.max_upload_bytes // (1024 * 1024)}MB."
                )
            hasher.update(chunk)
            tmp_file.write(chunk)
        tmp_file.close()

        content_hash = hasher.hexdigest()

        # Database transaction
        project = db.get(ProjectModel, "default")
        if project is None:
            project = ProjectModel(id="default", name="Default Project", status="active")
            db.add(project)

        # Check for duplicates
        existing_paper = db.query(PaperModel).filter(PaperModel.content_hash == content_hash).first()
        if existing_paper:
            os.unlink(temp_path)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"File already exists in library as '{existing_paper.title}'."
            )
            
        # Verify PDF is valid and not corrupted
        try:
            doc = fitz.open(temp_path)
            if doc.is_encrypted:
                doc.close()
                os.unlink(temp_path)
                raise HTTPException(status_code=422, detail="Encrypted PDFs are not supported.")
            doc.close()
        except fitz.FileDataError:
            os.unlink(temp_path)
            raise HTTPException(status_code=422, detail="Corrupted or invalid PDF file.")

        paper = PaperModel(
            id=file_id,
            project_id="default",
            title=Path(safe_filename).stem,
            authors=[],
            year=None,
            filename=safe_filename,
            content_hash=content_hash,
            file_size=total_size,
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
        raise
    except Exception as e:
        db.rollback()
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retry/{file_id}", status_code=status.HTTP_202_ACCEPTED)
def retry_upload(file_id: str = FastAPIPath(...), db: Session = Depends(get_db)):
    """
    Retries processing a failed document. Note that this requires the original file to still be available,
    which usually implies downloading it from cloud storage or re-uploading. For our architecture,
    if it failed during chunking/embedding, we might need to re-run the job.
    Since temp files are deleted, retry usually requires re-fetching from Supabase or failing.
    """
    paper = db.get(PaperModel, file_id)
    if not paper:
        raise HTTPException(status_code=404, detail="File not found")
        
    if paper.processing_status != "error":
        raise HTTPException(status_code=400, detail="Only failed uploads can be retried via this endpoint")
        
    # Mark as queued
    paper.processing_status = "queued"
    paper.error_message = None
    db.commit()
    
    # Normally we would dispatch a `retry_processing_task` that fetches from Supabase.
    # For now, we simulate enqueuing.
    return {"message": "Retry queued", "file_id": file_id}

@router.post("/cancel/{file_id}", status_code=status.HTTP_200_OK)
def cancel_upload(file_id: str = FastAPIPath(...), db: Session = Depends(get_db)):
    """
    Cancels an ongoing upload/processing job and marks it as cancelled.
    """
    paper = db.get(PaperModel, file_id)
    if not paper:
        raise HTTPException(status_code=404, detail="File not found")
        
    # In a full Celery setup, we'd revoke the task:
    # app.control.revoke(task_id, terminate=True)
    # But we don't store task_id in the DB yet, so we just mark it cancelled.
    
    paper.processing_status = "cancelled"
    paper.error_message = "Cancelled by user"
    db.commit()
    
    return {"message": "Upload cancelled", "file_id": file_id}
