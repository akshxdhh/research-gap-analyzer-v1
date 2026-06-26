from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, analyze, reports, status, projects, papers, gaps

app = FastAPI(
    title="Research Gap Analyzer API",
    description="Backend orchestration for AI-driven research gap inference.",
    version="1.0.0"
)

# Setup CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev. In production set to ["http://localhost:3000"]
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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to the Research Gap Analyzer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
