import asyncio
import logging

from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from app.services.rag_pipeline import answer_question
from app.utils.errors import safe_error_message


router = APIRouter(prefix="/query", tags=["query"])
logger = logging.getLogger("codemind.query")


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=2)
    k: int | None = Field(default=None, ge=1, le=10)
    history: list[dict] | None = Field(default=None)


@router.post("")
async def query(request: QueryRequest):
    try:
        kwargs = {}
        if request.k is not None:
            kwargs["k"] = request.k
        if request.history is not None:
            kwargs["history"] = request.history

        return await asyncio.to_thread(answer_question, request.question, **kwargs)
    except RuntimeError as exc:
        logger.warning("Query rejected: error=%s", safe_error_message(exc))
        raise HTTPException(status_code=400, detail=safe_error_message(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected query failure")
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {safe_error_message(exc)}") from exc
