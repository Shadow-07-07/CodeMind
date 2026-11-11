import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path

from app.config import BASE_DIR, get_settings
from app.routes import query, upload
from app.services.retriever import has_vector_store
from fastapi.staticfiles import StaticFiles


settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
logger = logging.getLogger("codemind")

app = FastAPI(title=settings.app_name, version="1.0.0")

origins = settings.parsed_cors_origins
allow_all_origins = "*" in origins or not origins

if allow_all_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

app.include_router(upload.router)
app.include_router(query.router)


@app.get("/health")
async def health_check():
    runtime_issues = settings.validate_runtime()
    return {
        "status": "ok" if not runtime_issues else "degraded",
        "service": settings.app_name,
        "llm_configured": settings.is_llm_configured,
        "has_indexed_documents": has_vector_store(),
        "runtime_issues": runtime_issues,
    }


# Optional: Serve built frontend SPA if dist/ is present
frontend_dist = BASE_DIR.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")

