import logging
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.embeddings import Embeddings

from app.config import get_settings

logger = logging.getLogger("codemind.embedding")

FALLBACK_EMBEDDING_MODELS = [
    "gemini-embedding-001",
    "models/text-embedding-004",
    "text-embedding-004",
    "models/embedding-001",
    "embedding-001",
]


class GeminiEmbeddings(Embeddings):
    def __init__(self, model: str, api_key: str):
        self.primary_model = model
        self.api_key = api_key
        self.client = GoogleGenerativeAIEmbeddings(
            model=model,
            google_api_key=api_key,
        )

    def _get_candidate_models(self) -> list[str]:
        candidates = [self.primary_model]
        for m in FALLBACK_EMBEDDING_MODELS:
            if m and m not in candidates:
                candidates.append(m)
        return candidates

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        last_error = None
        for model_name in self._get_candidate_models():
            try:
                client = GoogleGenerativeAIEmbeddings(
                    model=model_name,
                    google_api_key=self.api_key,
                )
                try:
                    embeddings = client.embed_documents(texts, batch_size=25)
                    if len(embeddings) == len(texts):
                        return embeddings
                except Exception:
                    # Sequential fallback
                    res = [client.embed_query(text) for text in texts]
                    if len(res) == len(texts):
                        return res
            except Exception as exc:
                last_error = exc
                logger.warning("Embedding model '%s' failed: %s; trying next candidate...", model_name, exc)
                continue

        raise last_error or RuntimeError("Failed to compute embeddings with any available Gemini embedding model.")

    def embed_query(self, text: str) -> list[float]:
        last_error = None
        for model_name in self._get_candidate_models():
            try:
                client = GoogleGenerativeAIEmbeddings(
                    model=model_name,
                    google_api_key=self.api_key,
                )
                return client.embed_query(text)
            except Exception as exc:
                last_error = exc
                logger.warning("Query embedding model '%s' failed: %s; trying next candidate...", model_name, exc)
                continue

        raise last_error or RuntimeError("Failed to compute query embedding with any available Gemini embedding model.")


def get_embeddings() -> GeminiEmbeddings:
    settings = get_settings()
    api_key = settings.google_genai_api_key
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY or GEMINI_API_KEY is not configured.")

    return GeminiEmbeddings(model=settings.gemini_embedding_model, api_key=api_key)
