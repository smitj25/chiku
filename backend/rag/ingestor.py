"""
ingestor.py — PDF/doc chunker + embedder. Run once per domain to populate ChromaDB.
Usage: python -m backend.rag.ingestor --plug engineering_sme --dir docs/engineering/
"""

from __future__ import annotations

import argparse
import hashlib
import logging
from pathlib import Path

from backend.config import settings
from backend.rag.vectorstore import get_or_create_collection

logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.log_level)


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
    """Split text into overlapping word-based chunks."""
    words = text.split()
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


def ingest_pdf(pdf_path: Path, namespace: str) -> int:
    """Chunk and embed a single PDF into the ChromaDB namespace collection."""
    try:
        from pypdf import PdfReader
    except ImportError:
        raise ImportError("pypdf is required. Run: pip install pypdf")

    collection = get_or_create_collection(namespace)
    reader = PdfReader(str(pdf_path))
    total = 0

    for page_num, page in enumerate(reader.pages, 1):
        page_text = page.extract_text() or ""
        if not page_text.strip():
            continue

        chunks = chunk_text(page_text)
        for i, chunk in enumerate(chunks):
            doc_id = hashlib.md5(f"{pdf_path.name}-{page_num}-{i}".encode()).hexdigest()
            collection.upsert(
                ids=[doc_id],
                documents=[chunk],
                metadatas=[{"source": pdf_path.name, "page": page_num, "chunk": i}],
            )
            total += 1

    logger.info(f"Ingested {total} chunks from '{pdf_path.name}' → namespace='{namespace}'")
    return total


def ingest_directory(directory: str, namespace: str) -> int:
    """Ingest all PDF files in a directory."""
    dirpath = Path(directory)
    if not dirpath.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")

    pdfs = list(dirpath.glob("**/*.pdf"))
    if not pdfs:
        logger.warning(f"No PDF files found in {directory}")
        return 0

    total = 0
    for pdf in pdfs:
        total += ingest_pdf(pdf, namespace)

    logger.info(f"Total ingested: {total} chunks from {len(pdfs)} files into '{namespace}'")
    return total


def main():
    parser = argparse.ArgumentParser(description="Ingest documents into ChromaDB")
    parser.add_argument("--plug", required=True, help="Plug ID (e.g. engineering_sme)")
    parser.add_argument("--dir", required=True, help="Directory containing PDFs")
    parser.add_argument("--namespace", help="Override ChromaDB namespace (defaults to plug ID prefix)")
    args = parser.parse_args()

    namespace = args.namespace or args.plug.replace("_sme", "")
    ingest_directory(args.dir, namespace)


if __name__ == "__main__":
    main()
