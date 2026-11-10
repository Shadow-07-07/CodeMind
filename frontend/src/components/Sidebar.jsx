import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileArchive,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { uploadFile } from "../api";

const ACCEPTED_EXTENSIONS = ".zip,.py,.js,.jsx,.ts,.tsx,.txt,.md,.json,.yaml,.yml,.css,.html,.pdf";

const PLAYBOOK_PROMPTS = [
  {
    category: "Architecture",
    icon: "🏛️",
    prompt: "Explain the high-level architecture, module boundaries, and data flow of this project.",
  },
  {
    category: "Bug Hunter",
    icon: "🐛",
    prompt: "Perform a security and bug audit: identify risks, root causes, and provide code fixes.",
  },
  {
    category: "Entrypoints",
    icon: "🔍",
    prompt: "What are the main application entry points and where are all API routes defined?",
  },
  {
    category: "Performance",
    icon: "⚡",
    prompt: "Analyze potential performance bottlenecks, async blocking issues, or memory leaks.",
  },
  {
    category: "Testing",
    icon: "🧪",
    prompt: "Suggest unit test cases and identify critical functions that lack test coverage.",
  },
];

export default function Sidebar({
  onIndexed,
  isReady,
  indexedSummary,
  onSelectPrompt,
  isOpen,
  onClearIndex,
  isClearing,
}) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");
  const [resetBeforeUpload, setResetBeforeUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFileProcess(file) {
    if (!file) return;

    setFileName(file.name);
    setStatus("loading");
    setMessage("Parsing, chunking, and indexing into vector store...");

    try {
      const result = await uploadFile(file, resetBeforeUpload);
      setStatus("success");
      setMessage(`${result.documents} files indexed into ${result.chunks} vector chunks.`);
      onIndexed?.(result);
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.detail || "Upload failed. Please check the file and try again.");
    }
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];
    if (file) handleFileProcess(file);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  return (
    <aside
      className={`fixed inset-y-16 left-0 z-20 flex w-80 flex-col border-r border-line bg-surface/95 transition-transform duration-300 lg:static lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
        {/* Knowledge Base Ingestion Card */}
        <div className="rounded-xl border border-line bg-panel p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-brand-cyan" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Codebase Ingestion
              </h2>
            </div>
            {isReady && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready
              </span>
            )}
          </div>

          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition ${
              isDragging
                ? "border-brand-500 bg-brand-500/10"
                : "border-line bg-ink/60 hover:border-brand-500/50 hover:bg-ink"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileInputChange}
            />

            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-400 transition group-hover:scale-110 group-hover:bg-brand-500/20">
              {status === "loading" ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand-cyan" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </div>

            <p className="text-xs font-semibold text-slate-200">
              {status === "loading"
                ? "Generating Embeddings..."
                : fileName
                ? fileName
                : "Upload Repository or Document"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Drag & drop <span className="text-brand-300 font-mono">.zip</span> or source files
            </p>

            <div className="mt-3 flex flex-wrap justify-center gap-1 text-[10px] text-slate-400">
              <span className="rounded bg-line/60 px-1.5 py-0.5 font-mono">.zip</span>
              <span className="rounded bg-line/60 px-1.5 py-0.5 font-mono">.py</span>
              <span className="rounded bg-line/60 px-1.5 py-0.5 font-mono">.js</span>
              <span className="rounded bg-line/60 px-1.5 py-0.5 font-mono">.ts</span>
              <span className="rounded bg-line/60 px-1.5 py-0.5 font-mono">.pdf</span>
              <span className="rounded bg-line/60 px-1.5 py-0.5 font-mono">.md</span>
            </div>
          </div>

          {/* Upload Status message */}
          {message && (
            <div
              className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                status === "success"
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : status === "error"
                  ? "border border-rose-500/20 bg-rose-500/10 text-rose-300"
                  : status === "loading"
                  ? "border border-brand-500/20 bg-brand-500/10 text-brand-300"
                  : "bg-surface text-slate-400"
              }`}
            >
              {status === "success" ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : status === "error" ? (
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : status === "loading" ? (
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : null}
              <span className="leading-tight">{message}</span>
            </div>
          )}

          {/* Options */}
          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={resetBeforeUpload}
                onChange={(e) => setResetBeforeUpload(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-line bg-ink text-brand-500 focus:ring-0 focus:ring-offset-0"
              />
              <span>Replace index on upload</span>
            </label>
          </div>
        </div>

        {/* Active Index Telemetry HUD */}
        {isReady && (
          <div className="rounded-xl border border-line bg-panel p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-brand-violet" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Vector Store Telemetry
                </h3>
              </div>
              <span className="rounded bg-brand-violet/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-violet">
                FAISS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-line/80 bg-ink/70 p-2.5">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-400" /> Documents
                </span>
                <p className="mt-1 text-base font-bold text-white">
                  {indexedSummary?.documents || "Ready"}
                </p>
              </div>

              <div className="rounded-lg border border-line/80 bg-ink/70 p-2.5">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Layers className="h-3 w-3 text-slate-400" /> Vector Chunks
                </span>
                <p className="mt-1 text-base font-bold text-brand-cyan">
                  {indexedSummary?.chunks || "Active"}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Splitter</span>
                <span className="font-mono text-slate-300">AST Recursive</span>
              </div>
              <div className="flex justify-between">
                <span>Chunk Size / Overlap</span>
                <span className="font-mono text-slate-300">1200 / 200</span>
              </div>
              <div className="flex justify-between">
                <span>Top-K Retrieval</span>
                <span className="font-mono text-brand-cyan">5 Chunks</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClearIndex}
              disabled={isClearing}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-ink/50 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <RefreshCw className={`h-3 w-3 ${isClearing ? "animate-spin" : ""}`} />
              Reset Vector Store
            </button>
          </div>
        )}

        {/* Engineering Playbooks / Quick Starter Prompts */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Engineering Playbooks
            </h3>
          </div>

          <div className="space-y-1.5">
            {PLAYBOOK_PROMPTS.map((item) => (
              <button
                key={item.category}
                type="button"
                onClick={() => onSelectPrompt(item.prompt)}
                className="group flex w-full items-start gap-2.5 rounded-xl border border-line/60 bg-panel/60 p-2.5 text-left transition hover:border-brand-500/40 hover:bg-panel hover:shadow-sm"
              >
                <span className="text-sm">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-brand-300">
                      {item.category}
                    </span>
                    <Zap className="h-3 w-3 text-slate-400 opacity-0 transition group-hover:opacity-100 group-hover:text-brand-cyan" />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                    {item.prompt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Footer info */}
      <div className="border-t border-line/80 bg-ink/40 p-3 text-center text-[11px] text-slate-400">
        <p className="flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Non-blocking Async Threadpool Active
        </p>
      </div>
    </aside>
  );
}
