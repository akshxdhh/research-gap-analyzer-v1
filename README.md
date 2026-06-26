# Research Gap Analyzer

An autonomous AI research assistant capable of reading uploaded research papers, searching external research papers, searching the web, and synthesizing evidence to identify research gaps.

## Architecture Pipeline

This system uses a highly optimized concurrent orchestration pipeline:
1. **Query Understanding**: Deconstructs user queries and extracts technical filters.
2. **Agent Planner**: Generates execution steps (tools, queries, fallbacks) dynamically.
3. **Retrieval Layer** (Concurrent Execution):
   - **Local RAG**: Hybrid search (BM25 + Dense Vectors) with Reciprocal Rank Fusion.
   - **Web Search**: Fallback external web searches.
   - **Paper Search**: Connects to arXiv and metadata APIs.
   - **Metadata Search**: Extracts structured relational data.
4. **Context Merger**: 0-1 Knapsack token optimization and MD5-based semantic deduplication.
5. **Research Analyzer**: LLM-driven deep reasoning, exact citation grounding, and gap inference.
6. **Report Generation**: Exports findings to Markdown, PDF, and DOCX formats.

## Tech Stack

- **Backend**: FastAPI, Python 3.14+, ChromaDB, Pytest, Pydantic (Strict JSON Schema)
- **Frontend**: Next.js 14+ (App Router), Zustand (State Management), Tailwind CSS, React
- **Deployment**: Docker, Docker Compose

## Quick Start

```bash
docker-compose up --build
```

- Backend API: http://localhost:8000
- Frontend: http://localhost:3000
