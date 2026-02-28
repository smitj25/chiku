"""
retriever.py — Query → top-k relevant chunks + metadata from ChromaDB.
Owned by ML Lead; integrated by BD#1 in main.py via `await retriever.get_chunks(...)`.
"""

from __future__ import annotations

import logging
from typing import Optional

from backend.config import settings

logger = logging.getLogger(__name__)


class Retriever:
    """
    Wraps ChromaDB collection queries.
    Falls back gracefully when ChromaDB is not available.
    """

    def __init__(self, chroma_client=None):
        self._client = chroma_client

    async def get_chunks(
        self,
        query: str,
        namespace: str,
        top_k: Optional[int] = None,
    ) -> list[dict]:
        """
        Returns top-k chunks from the ChromaDB collection for `namespace`.
        Each chunk: {"text": str, "source": str, "page": int, "score": float}
        """
        k = top_k or settings.top_k_chunks

        if self._client is None:
            logger.warning("ChromaDB client not available; returning empty chunks")
            return []

        try:
            collection = self._client.get_or_create_collection(
                f"{namespace}_docs",
                metadata={"hnsw:space": "cosine"},
            )
            if collection.count() == 0:
                logger.info(f"Collection '{namespace}_docs' is empty — no chunks retrieved")
                return []

            results = collection.query(
                query_texts=[query],
                n_results=min(k, collection.count()),
                include=["documents", "metadatas", "distances"],
            )

            chunks = []
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]

            for doc, meta, dist in zip(docs, metas, distances):
                # ChromaDB cosine distance → similarity
                score = max(0.0, 1.0 - dist)
                chunks.append({
                    "text": doc,
                    "source": meta.get("source", "Unknown"),
                    "page": int(meta.get("page", 1)),
                    "score": round(score, 4),
                    "namespace": namespace,
                })

            logger.info(f"Retrieved {len(chunks)} chunks from '{namespace}_docs' for query='{query[:60]}'")
            return chunks

        except Exception as e:
            logger.error(f"Retriever error for namespace '{namespace}': {e}")
            return []
