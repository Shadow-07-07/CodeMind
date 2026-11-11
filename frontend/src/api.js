import axios from "axios";

// Resolves backend API URL:
// 1. Explicit VITE_API_URL environment variable (if set in Vercel or .env)
// 2. Production fallback to Render backend if running on Vercel or any hosted domain
// 3. Localhost fallback for local development
export function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return "https://codemind-backend-c581.onrender.com";
    }
  }

  return "http://localhost:8000";
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 120000,
});

export default api;

export async function uploadFile(file, reset = false) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/upload?reset=${Boolean(reset)}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export async function resetIndex() {
  const response = await api.post("/upload/reset");
  return response.data;
}

export async function askQuestion(question, k = 5, history = []) {
  const response = await api.post("/query", { question, k, history });
  return response.data;
}

export async function checkHealth() {
  const response = await api.get("/health");
  return response.data;
}
