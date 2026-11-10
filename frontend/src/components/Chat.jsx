import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  FileCode,
  Flame,
  Layers,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askQuestion } from "../api";

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, "");
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "code";

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border border-line bg-ink/90 shadow-lg">
      <div className="flex items-center justify-between border-b border-line bg-panel/90 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Mac-style traffic lights */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="ml-2 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-300">
            {lang}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
        <code>{codeText}</code>
      </pre>
    </div>
  );
}

const STARTER_HERO_CARDS = [
  {
    title: "Explain Architecture",
    description: "Inspect component boundaries, module dependencies, and entrypoints.",
    prompt: "Explain the architecture and high-level design of this codebase.",
    icon: Layers,
    color: "from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20",
  },
  {
    title: "Scan for Bugs & Flaws",
    description: "Audit potential security vulnerabilities, logic traps, or unhandled errors.",
    prompt: "Scan this project for potential bugs, security issues, and error-handling flaws.",
    icon: ShieldAlert,
    color: "from-rose-500/20 to-orange-500/10 text-rose-400 border-rose-500/20",
  },
  {
    title: "Map API Routes",
    description: "Identify all backend endpoints, methods, inputs, and handler functions.",
    prompt: "Where are all API routes defined and what do their request/response schemas look like?",
    icon: Terminal,
    color: "from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/20",
  },
  {
    title: "Optimize Performance",
    description: "Spot blocking I/O, heavy computation, and suggest senior-level refactors.",
    prompt: "What are the performance bottlenecks in this codebase and how can we optimize them?",
    icon: Zap,
    color: "from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/20",
  },
];

export default function Chat({
  indexedSummary,
  isReady = false,
  activePrompt,
  onPromptConsumed,
}) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Consume playbook prompt from sidebar if selected
  useEffect(() => {
    if (activePrompt) {
      setQuestion(activePrompt);
      onPromptConsumed?.();
      textareaRef.current?.focus();
    }
  }, [activePrompt, onPromptConsumed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  async function submitQuestion(queryText = question) {
    const trimmed = queryText.trim();
    if (!trimmed || loading) return;

    setQuestion("");
    setLoading(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: [],
      },
    ]);

    try {
      const result = await askQuestion(trimmed, 5, history);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error.response?.data?.detail ||
            "Unable to generate response. Please ensure a codebase is uploaded and your API key is configured.",
          sources: [],
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  }

  function handleCopyAnswer(content, index) {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-ink">
      {/* Workspace Header */}
      <div className="flex h-14 items-center justify-between border-b border-line bg-surface/50 px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white sm:text-sm">
              Code Intelligence Workspace
            </h2>
            <p className="text-[11px] text-slate-400">
              {isReady
                ? `${indexedSummary?.chunks || "Active"} chunks grounded via RAG`
                : "Upload code to ground responses in your repository"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel/80 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowContext((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${showContext
                ? "border-brand-500/40 bg-brand-500/10 text-brand-300"
                : "border-line bg-panel/80 text-slate-400 hover:text-slate-200"
              }`}
          >
            {showContext ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>Citations</span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Hero Welcome Banner if no conversation yet */}
          {messages.length === 0 && (
            <div className="my-6 space-y-8 text-center">
              <div className="mx-auto flex max-w-lg flex-col items-center">
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-brand-cyan p-0.5 shadow-glow">
                  <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-ink">
                    <Code2 className="h-8 w-8 text-brand-cyan" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Codebase Intelligence at Your Fingertips
                </h1>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Upload your repository or docs to trace architectural logic, spot bugs, and receive grounded answers from a senior AI engineer.
                </p>
              </div>

              {/* Starter Quick Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-left">
                {STARTER_HERO_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() => submitQuestion(card.prompt)}
                      className={`group flex items-start gap-3.5 rounded-xl border bg-panel/50 p-4 transition hover:bg-panel hover:border-brand-500/40 hover:shadow-glow ${card.color}`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-line">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white group-hover:text-brand-300">
                            {card.title}
                          </h3>
                          <Flame className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100 text-brand-cyan" />
                        </div>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 sm:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              {message.role === "assistant" && (
                <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-cyan p-0.5 shadow-glow">
                  <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-ink">
                    <Bot className="h-4 w-4 text-brand-cyan" />
                  </div>
                </div>
              )}

              <div
                className={`min-w-0 max-w-3xl ${message.role === "user"
                    ? "rounded-2xl rounded-tr-sm border border-brand-500/30 bg-brand-600/15 p-4 text-white shadow-sm"
                    : "flex-1 rounded-2xl border border-line bg-panel/70 p-5 text-slate-100 shadow-sm"
                  }`}
              >
                {/* Assistant Message Header */}
                {message.role === "assistant" && (
                  <div className="mb-3 flex items-center justify-between border-b border-line/60 pb-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">CodeMind AI</span>
                      <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">
                        Senior RAG
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {message.timestamp && (
                        <span className="text-[10px] text-slate-400">{message.timestamp}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyAnswer(message.content, index)}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-surface hover:text-white transition"
                        title="Copy Answer"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Content Rendering */}
                {message.role === "assistant" ? (
                  <div className="space-y-3 text-sm leading-relaxed text-slate-200">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }) {
                          const isInline = inline || (!className && !String(children).includes("\n"));
                          if (isInline) {
                            return (
                              <code
                                className="rounded-md border border-line bg-ink px-1.5 py-0.5 font-mono text-xs text-amber-300"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }
                          return <CodeBlock className={className}>{children}</CodeBlock>;
                        },
                        h1: ({ children }) => (
                          <h1 className="mt-4 mb-2 flex items-center gap-2 text-base font-bold text-white border-b border-line pb-1.5">
                            <span className="h-2 w-2 rounded-full bg-brand-cyan"></span>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mt-3 mb-1.5 text-sm font-semibold text-white">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mt-2 text-xs font-semibold text-brand-300">
                            {children}
                          </h3>
                        ),
                        ul: ({ children }) => (
                          <ul className="my-2 list-disc list-inside space-y-1 pl-1 text-slate-300">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="my-2 list-decimal list-inside space-y-1 pl-1 text-slate-300">
                            {children}
                          </ol>
                        ),
                        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                        blockquote: ({ children }) => (
                          <blockquote className="my-3 border-l-2 border-brand-500 bg-surface/50 pl-3.5 py-1 italic text-slate-300 rounded-r-lg">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="my-3 overflow-x-auto rounded-lg border border-line">
                            <table className="w-full text-left text-xs">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => (
                          <thead className="border-b border-line bg-surface text-slate-200 uppercase text-[10px]">
                            {children}
                          </thead>
                        ),
                        th: ({ children }) => <th className="p-2.5 font-semibold">{children}</th>,
                        td: ({ children }) => (
                          <td className="p-2.5 border-t border-line/60 text-slate-300">{children}</td>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                )}

                {/* Grounded Retrieved Sources Citations */}
                {showContext && message.sources?.length > 0 && (
                  <div className="mt-4 rounded-xl border border-line bg-surface/80 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <FileCode className="h-3.5 w-3.5 text-brand-cyan" />
                        Grounded Sources ({message.sources.length} chunks)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {message.sources.map((source, sourceIndex) => (
                        <details
                          key={`${source.source}-${sourceIndex}`}
                          className="group rounded-lg border border-line bg-ink/70 p-2.5 transition"
                        >
                          <summary className="flex cursor-pointer items-center justify-between text-xs font-mono text-slate-300 hover:text-white">
                            <span className="flex items-center gap-2">
                              <span className="rounded bg-brand-500/20 px-1 py-0.5 text-[10px] text-brand-300">
                                #{sourceIndex + 1}
                              </span>
                              <span className="truncate max-w-sm font-medium">{source.source}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">
                              ▼
                            </span>
                          </summary>
                          <pre className="mt-2.5 max-h-56 overflow-auto rounded bg-ink p-3 font-mono text-[11px] leading-relaxed text-slate-400">
                            {source.content}
                          </pre>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === "user" && (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-line bg-panel text-slate-200">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking State */}
          {loading && (
            <div className="flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 text-xs text-brand-300 shadow-sm animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
              <span>Scanning vector store & synthesizing response with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Prompt Input Box */}
      <div className="border-t border-line bg-surface/90 p-4 backdrop-blur-xl sm:p-5">
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-2xl border border-line bg-panel shadow-2xl transition-all focus-within:border-brand-500/60 focus-within:shadow-glow">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask about architecture, bugs, logic flow, or follow up on previous answers..."
              className="w-full resize-none bg-transparent p-4 text-sm text-white placeholder-slate-500 outline-none focus:ring-0"
            />

            <div className="flex items-center justify-between border-t border-line/60 px-4 py-2.5">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="hidden sm:inline">
                  <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                    ↵ Enter
                  </kbd>{" "}
                  to send
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline">
                  <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                    ⇧ Shift+Enter
                  </kbd>{" "}
                  for newline
                </span>
              </div>

              <button
                type="button"
                onClick={() => submitQuestion()}
                disabled={loading || !question.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-cyan px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-glow active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>Ask CodeMind</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
