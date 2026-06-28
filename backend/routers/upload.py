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

@router.post("", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    local_rag: LocalRAGOrchestrator = Depends(get_local_rag),
    db: Session = Depends(get_db),
):
    """
    Uploads a PDF, chunks it using the semantic PDFProcessor, 
    uploads the file to Supabase Cloud Storage,
    and sends chunks to the Qdrant Cloud DB.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid MIME type. Must be application/pdf.")

    file_id = str(uuid.uuid4())
    safe_filename = Path(file.filename).name
    destination_name = f"{file_id}.pdf"
    
    try:
        # Save to temporary file for chunking
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            temp_path = tmp_file.name
            total = 0
            while chunk := file.file.read(1024 * 1024):
                total += len(chunk)
                if total > settings.max_upload_bytes:
                    os.unlink(temp_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="PDF exceeds maximum upload size.",
                    )
                tmp_file.write(chunk)
            
        # Process chunks locally
        processor = PDFProcessor()
        chunks = processor.process_pdf(temp_path, paper_id=file_id)
        
        # Upload to Cloud Storage (with graceful fallback)
        cloud_url = None
        try:
            storage = SupabaseStorage()
            cloud_url = storage.upload_pdf(temp_path, destination_name)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Supabase upload failed, falling back to local file. Error: {e}")
            # Ensure local uploads directory exists
            uploads_dir = Path("./uploads")
            uploads_dir.mkdir(exist_ok=True)
            # Move temp file to uploads instead of deleting
            import shutil
            shutil.move(temp_path, uploads_dir / destination_name)
            # Prevent deletion in the finally block
            temp_path = None
        
        # Cleanup temporary file if cloud upload succeeded
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

        # Send to Vector DB
        local_rag.index_chunks(chunks, collection_name=settings.vector_collection_name)

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
            cloud_url=cloud_url,
            chunk_count=len(chunks),
        )
        db.add(paper)
        db.commit()
        
        return UploadResponse(
            message="File uploaded, chunked, and stored successfully.",
            file_id=file_id,
            chunk_count=len(chunks)
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
