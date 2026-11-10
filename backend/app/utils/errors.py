import re

from app.config import get_settings


API_KEY_PATTERNS = [
    re.compile(r"AIza[0-9A-Za-z_\-]{20,}"),
    re.compile(r"sk-[0-9A-Za-z_\-]{20,}"),
    re.compile(r"AQ\.[0-9A-Za-z_\-]{20,}"),
]


def safe_error_message(error: Exception) -> str:
    message = str(error)

    # Redact any explicit API keys configured in settings
    try:
        key = get_settings().google_genai_api_key
        if key and len(key) >= 8:
            message = message.replace(key, "[redacted-api-key]")
    except Exception:
        pass

    for pattern in API_KEY_PATTERNS:
        message = pattern.sub("[redacted-api-key]", message)

    if "CONSUMER_SUSPENDED" in message or "has been suspended" in message:
        return "Gemini API key is suspended. Create a new key in Google AI Studio, update backend/.env, and restart the backend."

    if "PERMISSION_DENIED" in message or "403" in message:
        return "Gemini permission denied. Check that your API key is valid and enabled for the Gemini API."

    if "RESOURCE_EXHAUSTED" in message or "429" in message:
        return "Gemini API rate limit exceeded. Please wait a few seconds and try again."

    if "UNAVAILABLE" in message or "503" in message or "high demand" in message:
        return "Gemini service is experiencing high demand. Please try again in a few moments."

    if "NOT_FOUND" in message and ("models/" in message or "model" in message):
        return "Configured Gemini model was not found. Check gemini_embedding_model or gemini_chat_model in backend/app/config.py."

    if "faiss" in message.lower() and ("could not import" in message.lower() or "no module" in message.lower()):
        return "FAISS library is not installed in your Python environment. CodeMind has seamlessly switched to the built-in pure-Python vector engine."

    return message
