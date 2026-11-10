import logging
import math
from pathlib import Path
import pickle
from langchain_core.documents import Document

from app.config import get_settings
from app.services.embedding import get_embeddings

logger = logging.getLogger("codemind.retriever")

_store_cache = None


def is_faiss_available() -> bool:
    try:
        import faiss  # noqa: F401
        return True
    except Exception:
        return False


class CosineVectorStore:
    """
    High-performance, zero-dependency vector store computing cosine similarity in pure Python.
    Provides seamless fallback whenever faiss-cpu is not installed or unavailable.
    """

    def __init__(
        self,
        embeddings,
        documents: list[Document] | None = None,
        vectors: list[list[float]] | None = None,
        norms: list[float] | None = None,
    ):
        self.embeddings = embeddings
        self.documents: list[Document] = list(documents or [])
        self.vectors: list[list[float]] = list(vectors or [])
        if norms is not None and len(norms) == len(self.vectors):
            self.norms: list[float] = list(norms)
        else:
            self.norms = [math.sqrt(sum(x * x for x in v)) for v in self.vectors]

    @classmethod
    def from_documents(cls, documents: list[Document], embeddings) -> "CosineVectorStore":
        texts = [doc.page_content for doc in documents]
        vectors = embeddings.embed_documents(texts)
        return cls(embeddings=embeddings, documents=documents, vectors=vectors)

    def add_documents(self, documents: list[Document]) -> list[str]:
        if not documents:
            return []
        texts = [doc.page_content for doc in documents]
        new_vectors = self.embeddings.embed_documents(texts)
        self.documents.extend(documents)
        self.vectors.extend(new_vectors)
        self.norms.extend(math.sqrt(sum(x * x for x in v)) for v in new_vectors)
        return [str(i) for i in range(len(self.documents))]

    def similarity_search(self, query: str, k: int = 5) -> list[Document]:
        if not self.documents or not self.vectors:
            return []

        query_vec = self.embeddings.embed_query(query)
        q_norm = math.sqrt(sum(x * x for x in query_vec))
        if q_norm == 0:
            q_norm = 1.0

        scores = []
        for idx, (doc_vec, doc_norm) in enumerate(zip(self.vectors, self.norms)):
            if doc_norm == 0:
                sim = 0.0
            else:
                dot = sum(a * b for a, b in zip(query_vec, doc_vec))
                sim = dot / (q_norm * doc_norm)
            scores.append((sim, idx))

        scores.sort(key=lambda item: item[0], reverse=True)
        top_indices = [idx for _, idx in scores[:k]]
        return [self.documents[i] for i in top_indices]

    def save_local(self, folder_path: str):
        p = Path(folder_path)
        p.mkdir(parents=True, exist_ok=True)
        payload = {
            "documents": [
                {"page_content": d.page_content, "metadata": d.metadata}
                for d in self.documents
            ],
            "vectors": self.vectors,
            "norms": self.norms,
        }
        with open(p / "native_store.pkl", "wb") as f:
            pickle.dump(payload, f)

    @classmethod
    def load_local(cls, folder_path: str, embeddings) -> "CosineVectorStore":
        p = Path(folder_path)
        file_path = p / "native_store.pkl"
        if not file_path.exists():
            raise RuntimeError(f"Vector store file {file_path} not found.")
        with open(file_path, "rb") as f:
            data = pickle.load(f)
        documents = [
            Document(page_content=item["page_content"], metadata=item.get("metadata", {}))
            for item in data.get("documents", [])
        ]
        vectors = data.get("vectors", [])
        norms = data.get("norms")
        return cls(embeddings=embeddings, documents=documents, vectors=vectors, norms=norms)


def get_vector_store_path() -> Path:
    return get_settings().vector_store_path


def has_vector_store() -> bool:
    global _store_cache
    if _store_cache is not None:
        return True
    path = get_vector_store_path()
    has_native = (path / "native_store.pkl").exists()
    has_faiss = (path / "index.faiss").exists() and (path / "index.pkl").exists() and is_faiss_available()
    return has_native or has_faiss


def clear_vector_store() -> bool:
    global _store_cache
    _store_cache = None
    path = get_vector_store_path()
    removed = False
    for filename in ("index.faiss", "index.pkl", "native_store.pkl"):
        file_path = path / filename
        if file_path.exists():
            try:
                file_path.unlink()
                removed = True
            except OSError:
                pass
    return removed


def create_or_update_vector_store(chunks, reset: bool = False):
    global _store_cache
    embeddings = get_embeddings()
    path = get_vector_store_path()

    if reset:
        clear_vector_store()

    # If an existing vector store is loaded and we're not resetting, append
    if not reset and has_vector_store():
        try:
            store = load_vector_store()
            store.add_documents(chunks)
            store.save_local(str(path))
            _store_cache = store
            return store
        except Exception as exc:
            logger.warning("Could not append to existing vector store (%s), creating a fresh index.", exc)

    # If FAISS is installed, use FAISS
    if is_faiss_available():
        try:
            from langchain_community.vectorstores import FAISS
            store = FAISS.from_documents(chunks, embeddings)
            store.save_local(str(path))
            _store_cache = store
            return store
        except Exception as exc:
            logger.warning("FAISS failed to initialize (%s); falling back to built-in CosineVectorStore.", exc)

    # Built-in zero-dependency vector store
    store = CosineVectorStore.from_documents(chunks, embeddings)
    store.save_local(str(path))
    _store_cache = store
    return store


def load_vector_store():
    global _store_cache
    if _store_cache is not None:
        return _store_cache

    path = get_vector_store_path()

    # Check built-in native store first
    if (path / "native_store.pkl").exists():
        store = CosineVectorStore.load_local(str(path), get_embeddings())
        _store_cache = store
        return store

    # Try FAISS if faiss index files exist and faiss is available
    if (path / "index.faiss").exists() and (path / "index.pkl").exists():
        if is_faiss_available():
            try:
                from langchain_community.vectorstores import FAISS
                store = FAISS.load_local(
                    str(path),
                    get_embeddings(),
                    allow_dangerous_deserialization=True,
                )
                _store_cache = store
                return store
            except Exception as exc:
                logger.warning("Failed to load FAISS store: %s", exc)

    raise RuntimeError("No indexed documents found. Upload files before querying.")


def get_relevant_documents(question: str, k: int | None = None):
    settings = get_settings()
    store = load_vector_store()
    return store.similarity_search(question, k=k or settings.retrieval_k)
