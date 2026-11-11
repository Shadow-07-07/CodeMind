import { Cpu, Database, RotateCcw, Trash2, Menu, X, Code2 } from "lucide-react";

export default function Navbar({
  isReady,
  indexedSummary,
  onClearIndex,
  onResetChat,
  sidebarOpen,
  setSidebarOpen,
  isClearing,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-slate-300 transition hover:border-brand-500/50 hover:text-white lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-cyan p-0.5 shadow-glow">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-ink">
                <Code2 className="h-5 w-5 text-brand-cyan" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  Code<span className="bg-gradient-to-r from-brand-400 via-brand-cyan to-brand-violet bg-clip-text text-transparent">Mind</span>
                </span>
                <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-400">
                  RAG v1.2
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-400 sm:block">
                AI Developer Assistant & Codebase Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center / Status Pills */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Index Status Indicator */}
          <div className="flex items-center gap-2 rounded-full border border-line bg-panel/90 px-3 py-1.5 text-xs text-slate-300 shadow-inner">
            <span className="relative flex h-2 w-2">
              {isReady ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
              )}
            </span>
            <span className="font-medium">
              {isReady
                ? indexedSummary
                  ? `${indexedSummary.documents} files • ${indexedSummary.chunks} chunks indexed`
                  : "Vector Store Active"
                : "Awaiting Codebase"}
            </span>
          </div>

          {/* Model Pill */}
          <div className="hidden items-center gap-1.5 rounded-full border border-line bg-panel/60 px-3 py-1.5 text-xs text-slate-400 lg:flex">
            <Cpu className="h-3.5 w-3.5 text-brand-cyan" />
            <span>Gemini 1.5 / 2.0 Flash</span>
            <span className="text-slate-600">•</span>
            <Database className="h-3.5 w-3.5 text-brand-violet" />
            <span>FAISS Local</span>
          </div>
        </div>

        {/* Right / Actions */}
        <div className="flex items-center gap-2">
          {isReady && (
            <button
              type="button"
              onClick={onClearIndex}
              disabled={isClearing}
              title="Clear Vector Index"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isClearing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Clear Index</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetChat}
            title="Reset Conversation"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}
