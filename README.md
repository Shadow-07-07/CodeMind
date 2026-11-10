# CodeMind 🧠⚡

![Python](https://img.shields.io/badge/Python-3.11+-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-API-blue) ![React](https://img.shields.io/badge/React-Vite-blue) ![LangChain](https://img.shields.io/badge/LangChain-RAG-blue) ![FAISS](https://img.shields.io/badge/FAISS-Vector_DB-blue)
![Project](https://img.shields.io/badge/Project-RAG_AI-purple) ![Status](https://img.shields.io/badge/Status-Active-green) ![License](https://img.shields.io/badge/License-MIT-green)

CodeMind is a modern, full-stack Retrieval-Augmented Generation (RAG) developer assistant designed to read, analyze, explain, and debug codebases with senior-engineer precision. Upload a repository or technical document, then ask practical engineering questions such as:

- "Explain this project"
- "Find bugs"
- "What does this function do?"
- "Where are the API routes defined?"

The app reads your files, chunks the content, embeds the chunks into FAISS, retrieves the most relevant context for each question, and sends that grounded context to an LLM for a structured developer-focused answer.
 
## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Python, FastAPI, Uvicorn |
| RAG | LangChain, RecursiveCharacterTextSplitter |
| Vector Store | FAISS |
| LLM + Embeddings | Gemini API via `langchain-google-genai` |
| Frontend | React, Vite, TailwindCSS |
| HTTP Client | Axios |
| DevOps | Dockerfile, GitHub Actions CI |

> Note: The original architecture is provider-agnostic through LangChain. This repository is currently configured for Gemini because it works without an OpenAI API key. You can swap the embedding/chat services to OpenAI if preferred.

## Architecture

```text
User -> Upload -> Chunk -> Embed -> FAISS -> Query -> Retrieve -> LLM -> Answer
```

```text
React + Tailwind UI
        |
        | Axios
        v
FastAPI API
        |
        | Load zip/source/doc files
        v
RecursiveCharacterTextSplitter
        |
        | Gemini embeddings
        v
FAISS vector index
        |
        | similarity_search(top-k)
        v
Prompt + Gemini chat model
        |
        v
Answer + retrieved source context
```

## Features

- **Modern IDE-Grade Assistant UI**: Sleek dual-pane workspace with drag & drop ingestion, real-time index telemetry, curated prompt playbooks, and terminal-style code blocks with 1-click copying.
- **Multi-Format Codebase Ingestion**: Upload `.zip`, `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.txt`, `.md`, `.json`, `.yaml`, `.yml`, `.css`, `.pdf`, and `.html` files.
- **In-Memory Zip Processing**: Fast in-memory buffer decompression preventing OS file-locks on Windows/OneDrive with Zip-bomb size safety limits.
- **Technical Document & PDF Parsing**: Native PDF document extraction via `pypdf` for indexing technical specifications and RFCs.
- **Syntax-Aware Code Chunking**: AST-aware splitting using LangChain's `RecursiveCharacterTextSplitter` with language-specific separators (`class`, `def`, `export`, `function`).
- **Local FAISS Vector Indexing**: High-performance cosine similarity search with in-memory caching and on-demand index flushing.
- **Multi-Turn Conversational Memory**: Context-aware dialogue history enabling natural follow-up questions ("explain that function", "write a unit test for it").
- **Senior Developer Intelligence**: Grounded prompt engineering powered by Gemini for architectural explanations, root-cause bug diagnoses, and actionable remediation snippets.
- **Grounded Citation Inspector**: Inspect exact retrieved file chunks and similarity matches used to synthesize each response.
- **Defensive Error Sanitization**: Complete masking of API keys and automated translation for rate-limiting (429) and high-demand (503) states.
- **Production DevOps**: Containerized backend via Docker and automated CI pipeline using GitHub Actions.

## Project Structure

```text
codemind/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config.py
│   │   └── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/screenshots/
│   ├── src/
│   │   ├── components/
│   │   ├── api.js
│   │   └── App.jsx
│   └── package.json
├── .github/workflows/ci.yml
├── .gitignore
├── LICENSE
└── README.md
```

## Setup

### 1. Clone

```bash
git clone https://github.com/pun33th45/RAG-Based-Developer-Assistant.git
cd RAG-Based-Developer-Assistant
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

Run the API:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/health
```

Swagger docs:

```text
http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## API Endpoints

### `POST /upload`

Uploads and indexes a supported source/document file or zip archive.

```json
{
  "message": "Upload indexed successfully.",
  "filename": "repo.zip",
  "documents": 12,
  "chunks": 48
}
```

### `POST /query`

Asks a question against the indexed project context.

```json
{
  "question": "Find potential bugs",
  "k": 5
}
```

Response:

```json
{
  "answer": "The project has a possible authentication issue...",
  "sources": [
    {
      "source": "app/auth.py",
      "file_type": ".py",
      "content": "..."
    }
  ]
}
```

## Deployment

### Option 1: Docker Compose (Full Stack)

Run both frontend and backend in isolated containers with a single command:

```bash
docker compose up --build -d
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

### Option 2: Cloud Deployment (Render + Vercel)

- **Backend**: Deploy `backend/` to [Render](https://render.com) or [Railway](https://railway.app) with start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` and env `GOOGLE_API_KEY`.
- **Frontend**: Deploy `frontend/` to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) with build command `npm run build` and env `VITE_API_URL=https://your-backend.onrender.com`.

For comprehensive instructions, see the complete [Deployment Guide](docs/deployment.md).

## Sample Prompts

- "Explain this project"
- "Explain the architecture"
- "Find bugs"
- "What does this function do?"
- "How can this codebase be improved?"

## Future Improvements

- Multi-project indexes and index reset controls.
- Streaming responses.
- Authentication and per-user workspaces.
- Pinecone or hosted vector database option.
- GitHub repository ingestion by URL.
- Syntax-highlighted retrieved context.

## Author

Built by [Puneeth Raj](https://github.com/pun33th45).
