"""
retriever.py — Search ChromaDB for relevant document chunks.
Called by the /chat endpoint before sending to the LLM.
"""

import os
from typing import Optional

# Lazy-loaded singletons (heavy imports)
_embedder = None
_chroma   = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def _get_chroma():
    global _chroma
    if _chroma is None:
        import chromadb
        persist_dir = os.environ.get("CHROMA_PERSIST_DIR", "./data/chroma")
        _chroma = chromadb.PersistentClient(path=persist_dir)
    return _chroma


def retrieve(
    query: str,
    plug_id: str,
    top_k: int = 5,
    min_score: float = 0.3,
) -> list[dict]:
    """
    Search the ChromaDB collection for the given plug_id.
    Returns a list of dicts: { text, filename, page, score }
    Sorted by relevance (highest first).
    """
    collection_name = f"{plug_id}_docs"
    chroma = _get_chroma()

    # Check if collection exists
    try:
        collection = chroma.get_collection(collection_name)
    except Exception:
        return []  # No docs uploaded for this plug yet

    if collection.count() == 0:
        return []

    # Embed the query
    embedder  = _get_embedder()
    query_emb = embedder.encode([query]).tolist()

    # Search
    results = collection.query(
        query_embeddings=query_emb,
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    if not results or not results["documents"] or not results["documents"][0]:
        return []

    # Build output — ChromaDB distances are L2; lower = better
    # Convert to a 0-1 similarity score: score = 1 / (1 + distance)
    chunks = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        score = 1.0 / (1.0 + dist)
        if score < min_score:
            continue
        chunks.append({
            "text":     doc,
            "filename": meta.get("filename", "unknown"),
            "page":     meta.get("page", 0),
            "score":    round(score, 3),
        })

    # Sort by score descending
    chunks.sort(key=lambda x: x["score"], reverse=True)
    return chunks


def format_context(chunks: list[dict]) -> str:
    """
    Format retrieved chunks into a string the LLM can reference.
    Each chunk is labeled with its source filename and page.
    """
    if not chunks:
        return ""

    parts = ["CONTEXT FROM UPLOADED DOCUMENTS (cite these as [Source: filename, pg X]):"]
    for i, c in enumerate(chunks, 1):
        parts.append(
            f"\n--- Document {i}: {c['filename']}, Page {c['page']} ---\n"
            f"{c['text']}"
        )
    return "\n".join(parts)
