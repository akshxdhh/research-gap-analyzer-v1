from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from models.query import QueryFilters
from models.analyzer import AnalysisOutput
from models.report import ResearchReport

class AnalyzeRequest(BaseModel):
    query: str = Field(..., description="The user's natural language research query")
    filters: Optional[QueryFilters] = Field(default=None, description="Optional filters to restrict the search space")
    
class UploadResponse(BaseModel):
    message: str
    file_id: str
    chunk_count: int

class StatusResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    services: Dict[str, str] = Field(default_factory=dict)

class GenerateReportRequest(BaseModel):
    analysis: AnalysisOutput
    format: str = Field(default="markdown", description="Format to generate: markdown, pdf, or docx")
    
class ReportResponse(BaseModel):
    message: str
    file_path: str
    format: str
