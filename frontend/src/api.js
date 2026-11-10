import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 120000,
});

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
