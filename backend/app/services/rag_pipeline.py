import logging
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import get_settings
from app.services.retriever import get_relevant_documents

logger = logging.getLogger("codemind.rag")


SYSTEM_PROMPT = """You are CodeMind, an elite AI developer assistant powered by Retrieval-Augmented Generation (RAG).
Explain code clearly, trace architectures, and identify bugs with exact root cause analysis and actionable remediation."""

PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        (
            "human",
            """
Use the retrieved codebase context and recent conversation history to answer the user's question accurately.

Recent Conversation History:
{history}

Retrieved Codebase Context:
{context}

Question:
{question}

Guidelines:
- Be precise, grounded, and practical.
- Cite file paths and symbols from the context when relevant.
- If the answer is not present in the context, explicitly say what information is missing.
- For bug-finding or code-review requests, format clearly:
  • Severity (Critical / High / Medium / Low)
  • Location (File and function/component)
  • Root Cause (Why it occurs or risks involved)
  • Suggested Fix (With clean code snippet)
- If the user refers back to previous turns (e.g. "that function", "write tests for it"), use the conversation history to understand context.
""",
        ),
    ]
)


def format_history(history: list[dict] | None) -> str:
    if not history:
        return "None"
    lines = []
    # Include up to the last 6 messages (3 conversation turns), filtering out empty or dummy payloads
    for msg in history[-6:]:
        if not isinstance(msg, dict):
            continue
        role_raw = msg.get("role", "")
        content = str(msg.get("content", "")).strip()
        if not content:
            continue
        role = "User" if role_raw == "user" else "Assistant"
        lines.append(f"{role}: {content}")
    return "\n".join(lines) if lines else "None"


def format_context(documents) -> str:
    blocks = []
    for index, doc in enumerate(documents, start=1):
        source = doc.metadata.get("source", "unknown")
        blocks.append(f"[{index}] Source: {source}\n{doc.page_content}")
    return "\n\n---\n\n".join(blocks)


# Known stable production Gemini chat models with fallback cascade
CANDIDATE_CHAT_MODELS = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-1.5-flash-8b",
]


def answer_question(question: str, k: int | None = None, history: list[dict] | None = None) -> dict:
    settings = get_settings()
    documents = get_relevant_documents(question, k=k)
    context = format_context(documents)
    history_str = format_history(history)
    api_key = settings.google_genai_api_key

    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY or GEMINI_API_KEY is not configured.")

    models_to_try = [settings.gemini_chat_model]
    for fallback in CANDIDATE_CHAT_MODELS:
        if fallback and fallback not in models_to_try:
            models_to_try.append(fallback)

    last_error = None
    answer = None

    for model_name in models_to_try:
        try:
            llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=api_key,
                temperature=0.2,
                max_retries=1,
            )
            chain = PROMPT | llm | StrOutputParser()
            answer = chain.invoke({"question": question, "context": context, "history": history_str})
            if answer:
                logger.info("Successfully generated answer using model: %s", model_name)
                break
        except Exception as exc:
            last_error = exc
            logger.warning("Gemini chat model '%s' failed: %s; trying next fallback...", model_name, exc)
            continue

    if answer is None:
        raise last_error or RuntimeError("Failed to generate answer from language model.")

    return {
        "answer": answer,
        "sources": [
            {
                "source": doc.metadata.get("source", "unknown"),
                "file_type": doc.metadata.get("file_type", ""),
                "content": doc.page_content,
            }
            for doc in documents
        ],
    }
