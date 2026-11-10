import zipfile
from io import BytesIO
from pathlib import Path

from fastapi import UploadFile
from langchain_core.documents import Document
import pypdf

from app.config import get_settings


ALLOWED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".txt", ".md", ".json", ".yaml", ".yml", ".css", ".html", ".pdf"}
IGNORED_PARTS = {"node_modules", ".git", "__pycache__", "dist", "build", ".venv", "venv", ".idea", ".vscode"}
MAX_UNCOMPRESSED_ZIP_MB = 150


def is_allowed_file(path: Path) -> bool:
    return path.suffix.lower() in ALLOWED_EXTENSIONS


def is_ignored(path: Path) -> bool:
    return any(part in IGNORED_PARTS for part in path.parts)


def decode_text(data: bytes) -> str:
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return data.decode("latin-1", errors="ignore")


def extract_pdf_text(data: bytes) -> str:
    try:
        reader = pypdf.PdfReader(BytesIO(data))
        pages_text = []
        for index, page in enumerate(reader.pages, start=1):
            page_content = page.extract_text() or ""
            if page_content.strip():
                pages_text.append(f"--- Page {index} ---\n{page_content}")
        return "\n\n".join(pages_text)
    except Exception:
        return ""


def build_document(source: str, suffix: str, text: str) -> Document | None:
    if not text.strip():
        return None

    return Document(page_content=text, metadata={"source": source, "file_type": suffix})


def validate_upload_size(data: bytes) -> None:
    settings = get_settings()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise ValueError(f"Upload exceeds {settings.max_upload_size_mb}MB limit.")


async def load_documents_from_upload(file: UploadFile) -> list[Document]:
    filename = file.filename or "upload"
    suffix = Path(filename).suffix.lower()
    data = await file.read()

    validate_upload_size(data)

    if suffix == ".zip":
        return load_documents_from_zip_bytes(data)

    path = Path(filename)
    if not is_allowed_file(path):
        raise ValueError("Unsupported file type.")

    if suffix == ".pdf":
        text = extract_pdf_text(data)
    else:
        text = decode_text(data)

    document = build_document(path.name, suffix, text)
    return [document] if document else []


def load_documents_from_zip_bytes(data: bytes) -> list[Document]:
    documents: list[Document] = []
    max_uncompressed_bytes = MAX_UNCOMPRESSED_ZIP_MB * 1024 * 1024
    total_uncompressed = 0

    with zipfile.ZipFile(BytesIO(data)) as archive:
        for member in archive.infolist():
            total_uncompressed += member.file_size
            if total_uncompressed > max_uncompressed_bytes:
                raise ValueError(f"ZIP uncompressed content exceeds {MAX_UNCOMPRESSED_ZIP_MB}MB safety limit.")

        for member in archive.infolist():
            if member.is_dir():
                continue

            member_path = Path(member.filename)
            validate_zip_member(member_path)
            if is_ignored(member_path) or not is_allowed_file(member_path):
                continue

            suffix = member_path.suffix.lower()
            with archive.open(member) as handle:
                raw_bytes = handle.read()
                if suffix == ".pdf":
                    text = extract_pdf_text(raw_bytes)
                else:
                    text = decode_text(raw_bytes)

            document = build_document(member.filename, suffix, text)
            if document:
                documents.append(document)

    return documents


def validate_zip_member(member_path: Path) -> None:
    # Reject path traversal before reading zip content into memory.
    if member_path.is_absolute() or ".." in member_path.parts:
        raise ValueError("Unsafe zip path detected.")


def load_documents(path: Path) -> list[Document]:
    root = path
    files = [root] if root.is_file() else [item for item in root.rglob("*") if item.is_file()]
    documents: list[Document] = []

    for file_path in files:
        if is_ignored(file_path) or not is_allowed_file(file_path):
            continue
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            try:
                text = extract_pdf_text(file_path.read_bytes())
            except OSError:
                continue
        else:
            try:
                text = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = file_path.read_text(encoding="latin-1")
            except OSError:
                continue

        if text.strip():
            document = build_document(
                str(file_path.relative_to(root.parent if root.is_file() else root)),
                suffix,
                text,
            )
            if document:
                documents.append(document)

    return documents
