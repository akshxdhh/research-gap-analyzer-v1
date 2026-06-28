from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
from models.api_models import GenerateReportRequest, ReportResponse
from dependencies import get_report_generator, get_report_exporter
from modules.llm_layer import ReportGeneratorService
from modules.report_exporter import ReportExporter

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])

@router.post("")
async def generate_report(
    request: GenerateReportRequest,
    generator: ReportGeneratorService = Depends(get_report_generator),
    exporter: ReportExporter = Depends(get_report_exporter)
):
    try:
        # Generate semantic report strings
        report = generator.generate_report(request.analysis)
        
        # Temp directory for generated files
        os.makedirs("temp", exist_ok=True)
        file_id = str(uuid.uuid4())
        
        if request.format == "markdown":
            path = f"temp/{file_id}.md"
            exporter.export_markdown(report, path)
        elif request.format == "pdf":
            path = f"temp/{file_id}.pdf"
            exporter.export_pdf(report, path)
        elif request.format == "docx":
            path = f"temp/{file_id}.docx"
            exporter.export_docx(report, path)
        else:
            raise HTTPException(status_code=400, detail="Invalid format requested. Use markdown, pdf, or docx.")
            
        return FileResponse(path, filename=f"report.{request.format}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
