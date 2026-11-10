from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_upload_text_file_indexes_chunks(monkeypatch):
    indexed = {}

    def fake_create_or_update_vector_store(chunks):
        indexed["chunks"] = chunks

    monkeypatch.setattr("app.routes.upload.create_or_update_vector_store", fake_create_or_update_vector_store)

    response = client.post(
        "/upload",
        files={"file": ("notes.txt", b"CodeMind indexes project files for RAG answers.", "text/plain")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "notes.txt"
    assert data["documents"] == 1
    assert data["chunks"] >= 1
    assert len(indexed["chunks"]) == data["chunks"]


def test_upload_rejects_unsupported_file_type():
    response = client.post(
        "/upload",
        files={"file": ("image.exe", b"not a supported source file", "application/octet-stream")},
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_reset_index_endpoint(monkeypatch):
    monkeypatch.setattr("app.routes.upload.clear_vector_store", lambda: True)
    response = client.post("/upload/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["cleared"] is True


def test_upload_with_reset_flag(monkeypatch):
    calls = []

    def fake_create_or_update(chunks, reset=False):
        calls.append(reset)

    monkeypatch.setattr("app.routes.upload.create_or_update_vector_store", fake_create_or_update)

    response = client.post(
        "/upload?reset=true",
        files={"file": ("app.py", b"def main(): pass", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json()["reset"] is True
    assert calls == [True]


def test_upload_pdf_file_extracts_text(monkeypatch):
    monkeypatch.setattr("app.utils.file_loader.extract_pdf_text", lambda data: "Architecture documentation page.")
    monkeypatch.setattr("app.routes.upload.create_or_update_vector_store", lambda chunks, reset=False: None)

    response = client.post(
        "/upload",
        files={"file": ("spec.pdf", b"%PDF-1.4 mock pdf data", "application/pdf")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["documents"] == 1
    assert data["chunks"] >= 1


def test_cosine_vector_store_fallback():
    from langchain_core.documents import Document
    from app.services.retriever import CosineVectorStore

    class MockEmbeddings:
        def embed_documents(self, texts):
            # Deterministic mock vectors
            return [[float(len(t)), 1.0, 0.5] for t in texts]

        def embed_query(self, text):
            return [float(len(text)), 1.0, 0.5]

    emb = MockEmbeddings()
    docs = [
        Document(page_content="short", metadata={"source": "a.py"}),
        Document(page_content="longer text content here", metadata={"source": "b.py"}),
    ]

    store = CosineVectorStore.from_documents(docs, emb)
    results = store.similarity_search("short", k=1)
    assert len(results) == 1
    assert results[0].metadata["source"] == "a.py"

