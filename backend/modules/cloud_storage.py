import os
from supabase import create_client, Client
from fastapi import HTTPException
from config import settings

class SupabaseStorage:
    def __init__(self):
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for cloud storage.")
        self.supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        self.bucket = settings.supabase_storage_bucket

    def upload_pdf(self, file_path: str, destination_name: str) -> str:
        """Uploads a local file to Supabase storage and returns the public URL."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            with open(file_path, "rb") as f:
                res = self.supabase.storage.from_(self.bucket).upload(
                    path=destination_name,
                    file=f,
                    file_options={"content-type": "application/pdf"}
                )
            
            # If upload fails, typically supabase-py raises an error, but we can check res
            if hasattr(res, "error") and res.error:
                raise Exception(res.error.message)

            # Retrieve public URL
            public_url = self.supabase.storage.from_(self.bucket).get_public_url(destination_name)
            return public_url
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to cloud storage: {str(e)}")

