"""
router.py — Intent classifier: routes queries to the correct SME plug.
Stage 1: keyword matching against plug handoff_triggers (fast, ~0ms).
Stage 2: embedding cosine similarity against plug descriptions (slow, fallback only).
This is Backend Dev #2's module — BD#1 integrates the result in main.py.
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class IntentRouter:
    """
    Two-stage intent classifier.

    Usage:
        router = IntentRouter(plug_configs)
        target_plug = router.classify(query, current_plug="engineering_sme")
    """

    def __init__(self, plug_configs: dict[str, dict], openai_api_key: str = ""):
        self.plug_configs = plug_configs
        self._openai_key = openai_api_key
        self._embed_client = None  # Lazy-init OpenAI embeddings client
        self._plug_embeddings: dict[str, list[float]] = {}

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def classify(self, query: str, current_plug: str) -> str:
        """
        Returns the plug_id that should handle this query.
        If no switch is warranted, returns `current_plug` unchanged.
        """
        # Stage 1 — fast keyword scan
        candidate = self._keyword_classify(query)
        if candidate and candidate != current_plug:
            logger.info(
                f"Router [Stage1-keyword]: '{current_plug}' → '{candidate}' "
                f"for query='{query[:60]}'"
            )
            return candidate

        # Stage 2 — embedding similarity (only when Stage 1 is inconclusive)
        if self._openai_key:
            candidate = self._embedding_classify(query)
            if candidate and candidate != current_plug:
                logger.info(
                    f"Router [Stage2-embed]: '{current_plug}' → '{candidate}' "
                    f"for query='{query[:60]}'"
                )
                return candidate

        return current_plug

    # ------------------------------------------------------------------
    # Stage 1 — Keyword matcher
    # ------------------------------------------------------------------

    def _keyword_classify(self, query: str) -> Optional[str]:
        query_lower = query.lower()
        scores: dict[str, int] = {}

        for plug_id, cfg in self.plug_configs.items():
            triggers: list[str] = cfg.get("handoff_triggers", [])
            hit_count = sum(1 for kw in triggers if kw.lower() in query_lower)
            if hit_count > 0:
                scores[plug_id] = hit_count

        if not scores:
            return None

        # Return plug with highest keyword hit count
        best = max(scores, key=lambda p: scores[p])
        return best

    # ------------------------------------------------------------------
    # Stage 2 — Embedding similarity (OpenAI fallback)
    # ------------------------------------------------------------------

    def _embedding_classify(self, query: str) -> Optional[str]:
        try:
            from openai import OpenAI
            import numpy as np

            if not self._embed_client:
                self._embed_client = OpenAI(api_key=self._openai_key)

            # Embed the query
            query_vec = self._get_embedding(query)

            # Embed plug descriptions (cached)
            best_plug = None
            best_score = -1.0

            for plug_id, cfg in self.plug_configs.items():
                if plug_id not in self._plug_embeddings:
                    desc = cfg.get("persona", "") + " " + cfg.get("domain", "")
                    self._plug_embeddings[plug_id] = self._get_embedding(desc)

                plug_vec = self._plug_embeddings[plug_id]
                score = self._cosine_similarity(query_vec, plug_vec)

                if score > best_score:
                    best_score = score
                    best_plug = plug_id

            logger.debug(f"Embedding classify → {best_plug} (score={best_score:.3f})")
            return best_plug if best_score > 0.75 else None

        except Exception as e:
            logger.warning(f"Embedding classify failed: {e}")
            return None

    def _get_embedding(self, text: str) -> list[float]:
        resp = self._embed_client.embeddings.create(
            model="text-embedding-3-small",
            input=text[:2000],
        )
        return resp.data[0].embedding

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        try:
            import numpy as np
            va, vb = np.array(a), np.array(b)
            denom = np.linalg.norm(va) * np.linalg.norm(vb)
            return float(np.dot(va, vb) / denom) if denom > 0 else 0.0
        except ImportError:
            # Pure Python fallback
            dot = sum(x * y for x, y in zip(a, b))
            norm_a = sum(x ** 2 for x in a) ** 0.5
            norm_b = sum(x ** 2 for x in b) ** 0.5
            return dot / (norm_a * norm_b) if norm_a * norm_b > 0 else 0.0
