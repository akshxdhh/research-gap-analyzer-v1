from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import uuid
import os
from models.api_models import UploadResponse
from modules.chunking import PDFProcessor

router = APIRouter(prefix="/api/v1/upload", tags=["Upload"])

@router.post("/", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    """
    Uploads a PDF, chunks it using the semantic PDFProcessor, 
    and theoretically sends to the Local RAG DB.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid MIME type. Must be application/pdf.")
    os.makedirs("uploads", exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = f"uploads/{file_id}_{file.filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        processor = PDFProcessor()
        chunks = processor.process_pdf(file_path)
        
        # Here we would normally inject these chunks into the Vector DB & BM25 index
        # via the Local RAG service.
        
        return UploadResponse(
            message="File uploaded and chunked successfully.",
            file_id=file_id,
            chunk_count=len(chunks)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
