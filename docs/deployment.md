# CodeMind Deployment Guide 🚀

CodeMind is a decoupled full-stack RAG application consisting of a **FastAPI backend** and a **React (Vite) frontend**. You can deploy it using any of the following strategies depending on your needs.

---

## Architecture Overview

```text
  ┌────────────────────────────────┐        ┌──────────────────────────────┐
  │      React (Vite) Frontend     │        │        FastAPI Backend       │
  │  (Vercel / Netlify / Cloud)    │ ────►  │   (Render / Railway / VPS)   │
  │   VITE_API_URL=https://api...  │        │   GOOGLE_API_KEY=AIza...     │
  └────────────────────────────────┘        └──────────────────────────────┘
```

---

## Strategy 1: Free Cloud PaaS (Recommended)

This is the easiest, most cost-effective method for personal portfolios and production demos.

### Step 1: Deploy Backend (Render / Railway)

1. Push your repository to **GitHub**.
2. Sign in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Connect your GitHub repository.
4. Configure the settings:
   - **Name**: `codemind-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `GOOGLE_API_KEY`: Your Google Gemini API key from [Google AI Studio](https://aistudio.google.com).
   - `CORS_ORIGINS`: `*` (or your frontend domain once deployed).
6. Click **Deploy Web Service**.
7. Copy your backend URL (e.g., `https://codemind-backend.onrender.com`).

---

### Step 2: Deploy Frontend (Vercel / Netlify)

1. Sign in to [Vercel.com](https://vercel.com) and click **Add New... > Project**.
2. Select your GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://codemind-backend.onrender.com` without trailing slash).
5. Click **Deploy**.
6. Your assistant is now live on the web!

---

## Strategy 2: Single-Command Docker Compose

If you have a VPS (AWS EC2, DigitalOcean Droplet, Linode) or want to run everything locally in containers:

### 1. Configure Environment

Create `.env` in the project root:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 2. Start Full Stack

```bash
docker compose up --build -d
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop services:

```bash
docker compose down
```

---

## Strategy 3: Unified Single-Container (All-in-One)

You can build the frontend and let FastAPI serve it directly from a single container or server process, eliminating CORS completely.

### 1. Build Frontend Static Assets

```bash
cd frontend
npm install
npm run build
cd ..
```

This generates `frontend/dist`.

### 2. Run Backend

FastAPI automatically detects `frontend/dist` and serves the SPA at `/`:

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Now open [http://localhost:8000](http://localhost:8000) — the complete application runs on a single port!

---

## Environment Variables Reference

| Variable | Target | Required | Description | Default |
| :--- | :--- | :--- | :--- | :--- |
| `GOOGLE_API_KEY` | Backend | **Yes** | Gemini API key from Google AI Studio | None |
| `GEMINI_API_KEY` | Backend | No | Alternative alias for Google API key | None |
| `CORS_ORIGINS` | Backend | No | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `VITE_API_URL` | Frontend | **Yes (Prod)** | URL to the deployed backend service | `http://localhost:8000` |
| `PORT` | Backend | No | Port for backend process (cloud injected) | `8000` |

---

## Health Check Verification

After deployment, verify that the backend is healthy:

```bash
curl https://your-backend-url/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "CodeMind",
  "llm_configured": true,
  "has_indexed_documents": false,
  "runtime_issues": []
}
```

