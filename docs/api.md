# CodeMind API

Base URL for local development:

```text
http://localhost:8000
```

## Health Check

```http
GET /health
```

Returns runtime status, environment validation details, and vector store readiness.

Example response:

```json
{
  "status": "ok",
  "service": "CodeMind",
  "llm_configured": true,
  "has_indexed_documents": true,
  "runtime_issues": []
}
```

If the Gemini key is missing, `status` becomes `degraded` and `runtime_issues` explains the missing setting.

## Upload

```http
POST /upload?reset=false
Content-Type: multipart/form-data
```

Query parameters:
- `reset` (boolean, optional, default: `false`): When `true`, resets any previously indexed files before indexing the new upload.

Form field:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | File | Yes | Zip archive or supported source/document file |

Supported extensions include `.zip`, `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.txt`, `.md`, `.json`, `.yaml`, `.yml`, `.css`, `.pdf`, and `.html`.

Example response:

```json
{
  "message": "Upload indexed successfully.",
  "filename": "repo.zip",
  "documents": 12,
  "chunks": 48,
  "reset": false
}
```

Common errors:

| Status | Reason |
| --- | --- |
| `400` | Unsupported file type, unsafe zip path, file too large, or no readable supported files |
| `500` | Embedding provider or vector store failure |

## Reset Index

```http
POST /upload/reset
```

Clears the on-disk FAISS vector index and memory cache, allowing developers to switch repositories without cross-project contamination.

Example response:

```json
{
  "message": "Vector store index reset successfully.",
  "cleared": true
}
```

## Query

```http
POST /query
Content-Type: application/json
```

Request body:

```json
{
  "question": "Where are the routes defined?",
  "k": 5,
  "history": [
    { "role": "user", "content": "Explain this project" },
    { "role": "assistant", "content": "This is a FastAPI backend..." }
  ]
}
```

Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `question` | string | Yes | Developer question to answer from indexed context |
| `k` | integer | No | Number of chunks to retrieve, between 1 and 10 (default: 5) |
| `history` | array | No | Optional recent conversation turns `[{ role, content }]` for multi-turn follow-ups |

Example response:

```json
{
  "answer": "API routes are registered in `backend/app/main.py` via `app.include_router()`...",
  "sources": [
    {
      "source": "backend/app/main.py",
      "file_type": ".py",
      "content": "..."
    }
  ]
}
```

Common errors:

| Status | Reason |
| --- | --- |
| `400` | No documents indexed or invalid query payload |
| `500` | LLM provider failure |
