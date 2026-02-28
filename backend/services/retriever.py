"""
Retriever Service — Orchestrates document loading and retrieval 
for the active namespace/persona.
"""
from __future__ import annotations
from services.document_store import DocumentStore, RetrievedSection, document_store
from services.namespace_manager import namespace_manager


class RetrieverService:
    """High-level retrieval orchestrator that works with namespaces."""

    def __init__(self):
        # Cache: persona_id -> loaded DocumentStore
        self._stores: dict[str, DocumentStore] = {}

    def retrieve(
        self,
        query: str,
        persona_id: str | None = None,
        top_k: int = 5,
    ) -> list[RetrievedSection]:
        """Retrieve relevant sections for a query in the given persona's namespace."""
        pid = persona_id or (
            namespace_manager.get_active_persona().id
            if namespace_manager.get_active_persona()
            else None
        )
        if not pid:
            return []

        store = self._get_or_load_store(pid)
        return store.retrieve(query, top_k=top_k)

    def _get_or_load_store(self, persona_id: str) -> DocumentStore:
        """Get a cached store or load documents for this persona."""
        if persona_id not in self._stores:
            store = DocumentStore()
            corpus_texts = namespace_manager.get_corpus_texts(persona_id)
            store.load_corpus(corpus_texts)
            self._stores[persona_id] = store
        return self._stores[persona_id]

    def invalidate_cache(self, persona_id: str | None = None):
        """Clear cached stores (e.g., when corpus changes)."""
        if persona_id:
            self._stores.pop(persona_id, None)
        else:
            self._stores.clear()


# Singleton
retriever_service = RetrieverService()
