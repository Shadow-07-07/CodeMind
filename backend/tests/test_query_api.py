from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_query_returns_answer_and_sources(monkeypatch):
    def fake_answer_question(question: str, k: int | None = None):
        return {
            "answer": f"Answered: {question}",
            "sources": [
                {
                    "source": "backend/app/main.py",
                    "file_type": ".py",
                    "content": "app = FastAPI()",
                }
            ],
        }

    monkeypatch.setattr("app.routes.query.answer_question", fake_answer_question)

    response = client.post("/query", json={"question": "Explain this project", "k": 3})

    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "Answered: Explain this project"
    assert data["sources"][0]["source"] == "backend/app/main.py"


def test_query_returns_400_when_index_is_missing(monkeypatch):
    def fake_answer_question(question: str, k: int | None = None):
        raise RuntimeError("No indexed documents found. Upload files before querying.")

    monkeypatch.setattr("app.routes.query.answer_question", fake_answer_question)

    response = client.post("/query", json={"question": "Find bugs"})

    assert response.status_code == 400
    assert "No indexed documents found" in response.json()["detail"]


def test_query_passes_history(monkeypatch):
    recorded = {}

    def fake_answer_question(question: str, k: int | None = None, history: list[dict] | None = None):
        recorded["history"] = history
        return {"answer": "Answered with context", "sources": []}

    monkeypatch.setattr("app.routes.query.answer_question", fake_answer_question)

    history_payload = [
        {"role": "user", "content": "Where is the API entrypoint?"},
        {"role": "assistant", "content": "In backend/app/main.py"},
    ]

    response = client.post(
        "/query",
        json={"question": "What middleware does it use?", "history": history_payload},
    )

    assert response.status_code == 200
    assert recorded["history"] == history_payload
