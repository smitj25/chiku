"""
ingestor.py — PDF chunker + ChromaDB embedder
Run once per plug: python -m backend.rag.ingestor
Watches data/docs/{plug_id}/ and ingests all PDFs found.
"""

import os
import sys
import hashlib
from pathlib import Path


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> list[str]:
    """Split text into overlapping word chunks."""
    words  = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return [c for c in chunks if len(c.strip()) > 50]


def ingest_plug(plug_id: str, docs_dir: str = "./data/docs") -> int:
    """
    Ingest all PDFs from data/docs/{plug_id}/ into ChromaDB.
    Returns number of chunks stored.
    """
    import chromadb
    from sentence_transformers import SentenceTransformer

    plug_docs_path = Path(docs_dir) / plug_id
    if not plug_docs_path.exists():
        print(f"  ⚠  No docs folder at {plug_docs_path} — skipping {plug_id}")
        return 0

    pdf_files = list(plug_docs_path.glob("*.pdf"))
    txt_files = list(plug_docs_path.glob("*.txt"))   # also accept plain text
    all_files = pdf_files + txt_files

    if not all_files:
        print(f"  ⚠  No PDF or TXT files in {plug_docs_path} — skipping {plug_id}")
        print(f"     Drop a PDF into {plug_docs_path}/ and re-run")
        return 0

    # Init ChromaDB + embedder
    chroma   = chromadb.PersistentClient(path="./data/chroma")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    # Get or recreate collection
    collection_name = f"{plug_id}_docs"
    try:
        chroma.delete_collection(collection_name)
        print(f"  ↻  Cleared existing collection: {collection_name}")
    except Exception:
        pass
    collection = chroma.create_collection(collection_name)

    total_chunks = 0

    for filepath in all_files:
        print(f"  📄  Processing: {filepath.name}")

        # Extract text
        if filepath.suffix.lower() == ".pdf":
            text_by_page = _extract_pdf(filepath)
        else:
            text_by_page = {1: filepath.read_text(encoding="utf-8", errors="ignore")}

        for page_num, page_text in text_by_page.items():
            if not page_text.strip():
                continue

            chunks = chunk_text(page_text)
            if not chunks:
                continue

            # Embed all chunks for this page
            embeddings = embedder.encode(chunks).tolist()

            # Build unique IDs
            ids = [
                hashlib.md5(
                    f"{filepath.name}_{page_num}_{i}_{c[:30]}".encode()
                ).hexdigest()
                for i, c in enumerate(chunks)
            ]

            metadatas = [
                {
                    "filename":    filepath.name,
                    "page":        page_num,
                    "chunk_index": i,
                    "plug_id":     plug_id,
                }
                for i in range(len(chunks))
            ]

            collection.add(
                documents=chunks,
                embeddings=embeddings,
                ids=ids,
                metadatas=metadatas,
            )
            total_chunks += len(chunks)

        print(f"     ✓ {total_chunks} chunks stored")

    return total_chunks


def _extract_pdf(filepath: Path) -> dict[int, str]:
    """Extract text per page from PDF. Returns {page_num: text}."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(filepath))
        pages  = {}
        for i, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages[i] = text
        return pages
    except ImportError:
        print("  ⚠  pypdf not installed. Run: pip install pypdf")
        return {}
    except Exception as e:
        print(f"  ⚠  Could not read {filepath.name}: {e}")
        return {}


def ingest_all():
    """Ingest all three plug namespaces."""
    plug_ids = ["engineering", "legal", "healthcare"]
    print("\n🔄  SME-Plug Document Ingestor")
    print("=" * 44)

    grand_total = 0
    for plug_id in plug_ids:
        print(f"\n[{plug_id.upper()}]")
        count = ingest_plug(plug_id)
        grand_total += count
        if count > 0:
            print(f"  ✓  {count} total chunks indexed for {plug_id}")

    print(f"\n{'='*44}")
    print(f"✓  Done. {grand_total} total chunks across all plugs.\n")


if __name__ == "__main__":
    plug = sys.argv[1] if len(sys.argv) > 1 else None
    if plug:
        print(f"\n🔄  Ingesting {plug} documents...")
        count = ingest_plug(plug)
        print(f"✓  {count} chunks stored.")
    else:
        ingest_all()
