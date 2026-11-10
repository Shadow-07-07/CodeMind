from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    app_name: str = "CodeMind"
    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_embedding_model: str = "gemini-embedding-2-preview"
    gemini_chat_model: str = "gemini-3-flash-preview"
    vector_store_path: Path = BASE_DIR / "storage" / "faiss"
    upload_dir: Path = BASE_DIR / "storage" / "uploads"
    max_upload_size_mb: int = 50
    chunk_size: int = 1200
    chunk_overlap: int = 200
    retrieval_k: int = 5
    cors_origins: list[str] | str = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        populate_by_name=True,
        extra="ignore",
    )

    @property
    def parsed_cors_origins(self) -> list[str]:
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return self.cors_origins

    @property
    def google_genai_api_key(self) -> str:
        return self.google_api_key or self.gemini_api_key

    @computed_field
    @property
    def is_llm_configured(self) -> bool:
        return bool(self.google_genai_api_key)

    def validate_runtime(self) -> list[str]:
        issues = []
        if not self.google_genai_api_key:
            issues.append("GOOGLE_API_KEY or GEMINI_API_KEY is required for upload and query workflows.")
        if self.chunk_overlap >= self.chunk_size:
            issues.append("chunk_overlap must be smaller than chunk_size.")
        return issues


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.vector_store_path.mkdir(parents=True, exist_ok=True)
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    return settings
