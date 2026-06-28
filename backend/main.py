from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, analyze, reports, status, projects, papers, gaps, settings

app = FastAPI(
    title="Research Gap Analyzer API",
    description="Backend orchestration for AI-driven research gap inference.",
    version="1.0.0"
)

from config import settings as app_settings

# Setup CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(reports.router)
app.include_router(status.router)
app.include_router(projects.router)
app.include_router(papers.router)
app.include_router(gaps.router)
app.include_router(settings.router)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the exception for the server console
    import traceback
    traceback.print_exc()
    
    # Return 500 with CORS headers to avoid 'Network Error' masking in browser
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in app_settings.cors_origins or "*" in app_settings.cors_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
        headers=headers
    )

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the Research Gap Analyzer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
