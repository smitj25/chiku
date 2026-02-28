"""
vectorstore.py — ChromaDB initialisation and namespace-per-SME-plug management.
This module is owned by the ML Lead. BD#1 imports get_chroma_client() in main.py.
"""

from __future__ import annotations

import logging
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.config import settings

logger = logging.getLogger(__name__)

_client: Optional[chromadb.ClientAPI] = None


def get_chroma_client() -> chromadb.ClientAPI:
    """
    Returns a singleton ChromaDB HTTP client.
    Falls back to local persistent client if HTTP is unavailable (useful for local dev).
    """
    global _client
    if _client is not None:
        return _client

    try:
        _client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
        )
        _client.heartbeat()
        logger.info(f"ChromaDB HTTP client connected: {settings.chroma_host}:{settings.chroma_port}")
    except Exception as e:
        logger.warning(f"ChromaDB HTTP unavailable ({e}). Falling back to local persistent client.")
        _client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def get_or_create_collection(namespace: str) -> chromadb.Collection:
    """Get or create a ChromaDB collection for a given plug namespace."""
    client = get_chroma_client()
    collection_name = f"{namespace}_docs"
    col = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )
    logger.debug(f"Collection ready: {collection_name} ({col.count()} docs)")
    return col


def reset_collection(namespace: str):
    """Deletes and recreates a collection. Use during re-ingestion."""
    client = get_chroma_client()
    collection_name = f"{namespace}_docs"
    try:
        client.delete_collection(collection_name)
        logger.warning(f"Collection deleted: {collection_name}")
    except Exception:
        pass
    return get_or_create_collection(namespace)
