from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import uuid

class ChunkMetadata(BaseModel):
    paper_id: Optional[str] = None
    page_number: Optional[int] = None
    section: Optional[str] = None
    extra_metadata: Dict[str, Any] = Field(default_factory=dict)

class Chunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    metadata: ChunkMetadata
