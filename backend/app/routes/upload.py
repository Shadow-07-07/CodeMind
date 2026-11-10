import asyncio
import logging

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.services.retriever import clear_vector_store, create_or_update_vector_store
from app.utils.chunking import chunk_documents
from app.utils.errors import safe_error_message
from app.utils.file_loader import load_documents_from_upload


router = APIRouter(prefix="/upload", tags=["upload"])
logger = logging.getLogger("codemind.upload")


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    reset: bool = Query(default=False, description="Reset existing index before adding new files"),
):
    try:
        logger.info("Processing upload: filename=%s content_type=%s reset=%s", file.filename, file.content_type, reset)
        documents = await load_documents_from_upload(file)

        if not documents:
            logger.warning("Upload contained no supported readable files: filename=%s", file.filename)
            raise HTTPException(status_code=400, detail="No supported readable files found.")

        chunks = await asyncio.to_thread(chunk_documents, documents)
        if reset:
            await asyncio.to_thread(create_or_update_vector_store, chunks, reset=True)
        else:
            await asyncio.to_thread(create_or_update_vector_store, chunks)
        logger.info("Upload indexed: filename=%s documents=%s chunks=%s reset=%s", file.filename, len(documents), len(chunks), reset)

        return {
            "message": "Upload indexed successfully.",
            "filename": file.filename,
            "documents": len(documents),
            "chunks": len(chunks),
            "reset": reset,
        }
    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning("Upload validation failed: filename=%s error=%s", file.filename, exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.error("Upload runtime failure: filename=%s error=%s", file.filename, safe_error_message(exc))
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected upload failure: filename=%s", file.filename)
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {safe_error_message(exc)}") from exc
    finally:
        await file.close()


@router.post("/reset")
async def reset_index():
    try:
        cleared = clear_vector_store()
        logger.info("Vector store reset: cleared=%s", cleared)
        return {"message": "Vector store index reset successfully.", "cleared": cleared}
    except Exception as exc:
        logger.exception("Failed to reset vector index")
        raise HTTPException(status_code=500, detail=f"Failed to reset index: {safe_error_message(exc)}") from exc
