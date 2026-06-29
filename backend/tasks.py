import os
import json
import redis
import traceback
import logging
from celery_app import celery_app
from database import SessionLocal
from models.metadata import PaperModel
from modules.chunking import PDFProcessor
from dependencies import get_local_rag
from config import settings
from modules.cloud_storage import SupabaseStorage

logger = logging.getLogger(__name__)
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

def publish_status(file_id: str, status: str, progress: float, error_message: str = None):
    # Publish to Redis channel 'job_status'
    payload = {
        "file_id": file_id,
        "status": status,
        "progress": progress,
        "error_message": error_message
    }
    redis_client.publish("job_status", json.dumps(payload))

@celery_app.task(bind=True, max_retries=3)
def process_document_task(self, file_id: str, temp_path: str, safe_filename: str):
    db = SessionLocal()
    try:
        # Update status to extracting
        paper = db.query(PaperModel).filter(PaperModel.id == file_id).first()
        if not paper:
            return
        
        paper.processing_status = "extracting"
        paper.processing_progress = 10.0
        db.commit()
        publish_status(file_id, "extracting", 10.0)

        logger.info(f"[{file_id}] Upload Started. Chunking PDF...")
        # Chunking
        processor = PDFProcessor()
        chunks = processor.process_pdf(temp_path, paper_id=file_id)
        
        logger.info(f"[{file_id}] Chunking completed. Extracted {len(chunks)} chunks.")

        paper.processing_status = "chunking"
        paper.processing_progress = 40.0
        paper.chunk_count = len(chunks)
        db.commit()
        publish_status(file_id, "chunking", 40.0)

        # Upload to Cloud Storage
        paper.processing_status = "uploading"
        paper.processing_progress = 50.0
        db.commit()
        publish_status(file_id, "uploading", 50.0)

        cloud_url = None
        destination_name = f"{file_id}.pdf"
        try:
            logger.info(f"[{file_id}] Uploading to Supabase Cloud Storage...")
            storage = SupabaseStorage()
            cloud_url = storage.upload_pdf(temp_path, destination_name)
            if not cloud_url:
                raise Exception("Upload failed, empty URL returned")
            logger.info(f"[{file_id}] Cloud storage upload verified: {cloud_url}")
        except Exception as e:
            logger.warning(f"[{file_id}] Supabase upload failed: {e}. Falling back to local storage.")
            from pathlib import Path
            import shutil
            uploads_dir = Path("./uploads")
            uploads_dir.mkdir(exist_ok=True)
            shutil.copy(temp_path, uploads_dir / destination_name)

        paper.cloud_url = cloud_url

        # Vector Indexing
        paper.processing_status = "embedding"
        paper.processing_progress = 60.0
        db.commit()
        publish_status(file_id, "embedding", 60.0)

        local_rag = get_local_rag()
        logger.info(f"[{file_id}] Embedding {len(chunks)} chunks into Qdrant...")
        local_rag.index_chunks(chunks, collection_name=settings.vector_collection_name)
        logger.info(f"[{file_id}] Embedding and indexing verified.")

        # Ready
        paper.processing_status = "ready"
        paper.processing_progress = 100.0
        db.commit()
        publish_status(file_id, "ready", 100.0)

        # Cleanup
        if os.path.exists(temp_path):
            os.unlink(temp_path)

    except Exception as exc:
        db.rollback()
        error_msg = str(exc)
        logger.error(f"Error processing document {file_id}: {error_msg}")
        logger.error(traceback.format_exc())
        
        paper = db.query(PaperModel).filter(PaperModel.id == file_id).first()
        if paper:
            paper.processing_status = "error"
            paper.error_message = error_msg
            db.commit()
            publish_status(file_id, "error", paper.processing_progress, error_message=error_msg)
        
        # Exponential backoff (retry after 1s, 2s, 4s, etc)
        retry_delay = 2 ** self.request.retries
        logger.info(f"[{file_id}] Retrying in {retry_delay}s... (Attempt {self.request.retries + 1}/{self.max_retries})")
        raise self.retry(exc=exc, countdown=retry_delay)
    finally:
        db.close()
