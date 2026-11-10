import { FileArchive, RotateCcw, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { resetIndex, uploadFile } from "../api";

const ACCEPTED_EXTENSIONS = ".zip,.py,.js,.jsx,.ts,.tsx,.txt,.md,.json,.yaml,.yml,.css,.html,.pdf";

export default function Upload({ onIndexed, isReady = false }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [resetBeforeUpload, setResetBeforeUpload] = useState(false);

  useEffect(() => {
    if (isReady && status === "idle") {
      setStatus("success");
      setMessage("Project index loaded and ready for questions.");
    }
  }, [isReady, status]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus("loading");
    setMessage("Indexing your upload...");

    try {
      const result = await uploadFile(file, resetBeforeUpload);
      setStatus("success");
      setMessage(`${result.documents} files indexed into ${result.chunks} chunks.`);
      onIndexed?.(result);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.detail || "Upload failed.");
    } finally {
      event.target.value = "";
    }
  }

  async function handleClearIndex() {
    if (!window.confirm("Are you sure you want to clear the vector index?")) return;
    setStatus("loading");
    setMessage("Clearing index...");
    try {
      await resetIndex();
      setStatus("idle");
      setFileName("");
      setMessage("Vector index cleared. Ready for a new codebase.");
      onIndexed?.(null);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.detail || "Failed to clear index.");
    }
  }

  const statusColor = {
    idle: "text-slate-400",
    loading: "text-amber-300",
    success: "text-emerald-300",
    error: "text-rose-300",
  }[status];

  return (
    <section className="border-b border-line bg-panel/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-ink">
            <FileArchive className="h-5 w-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">CodeMind</h1>
            <p className={`text-sm ${statusColor}`}>{message || "Upload a zip or source document to start."}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={resetBeforeUpload}
              onChange={(e) => setResetBeforeUpload(e.target.checked)}
              className="rounded border-line bg-ink text-accent focus:ring-0"
            />
            Replace index on upload
          </label>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleUpload}
          />

          <button
            type="button"
            onClick={handleClearIndex}
            disabled={status === "loading"}
            title="Clear vector store index"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Clear Index
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            {status === "loading" ? "Indexing..." : fileName ? "Upload Another" : "Upload Codebase"}
          </button>
        </div>
      </div>
    </section>
  );
}
