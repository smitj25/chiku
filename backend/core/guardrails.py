"""
guardrails.py — Regex + LLM-based input/output validation. Backend Dev #2's module.
Pipeline:
  1. Input sanitisation  — PII redaction before the LLM ever sees the message
  2. Forbidden topic check — reject or flag if plug config prohibits the subject
  3. Output citation check — every factual response must contain [Source: X, pg N]
  4. Output PII check     — strip any PII the LLM accidentally echoed
"""

from __future__ import annotations

import logging
import re
from typing import Optional

from backend.config import settings
from backend.schemas import Citation

logger = logging.getLogger(__name__)

# Citation pattern: [Source: anything, pg <number>]
CITATION_RE = re.compile(r"\[Source:\s*([^,\]]+),\s*pg\s*(\d+)\]", re.IGNORECASE)
# Sentences that end with a period (rough heuristic)
FACTUAL_SENTENCE_RE = re.compile(r"[A-Z][^.!?]*\.[^\s]", re.MULTILINE)


class Guardrails:
    """
    Per-request guardrail processor configured by the active plug's JSON config.
    """

    def __init__(self, plug_config: dict):
        self.plug_config = plug_config
        self.citation_required: bool = plug_config.get("citation_required", True)
        self.forbidden_topics: list[str] = plug_config.get("forbidden_topics", [])
        self._pii_patterns = [re.compile(p) for p in settings.pii_patterns]

    # ------------------------------------------------------------------
    # Input sanitisation (called BEFORE LLM)
    # ------------------------------------------------------------------

    def sanitise_input(self, user_message: str) -> tuple[str, bool, Optional[str]]:
        """
        Redact PII and check forbidden topics in the user's message.
        Returns: (sanitised_message, triggered, reason)
        """
        # 1. PII redaction
        sanitised = self._redact_pii(user_message)
        if sanitised != user_message:
            logger.warning("PII detected and redacted from user input")

        # 2. Forbidden topic check (input side)
        triggered, reason = self._check_forbidden_topics(sanitised)
        return sanitised, triggered, reason

    # ------------------------------------------------------------------
    # Output validation (called AFTER LLM)
    # ------------------------------------------------------------------

    def validate(self, llm_response: str) -> tuple[str, bool, Optional[str]]:
        """
        Validates and sanitises LLM output.
        Returns: (safe_response, guardrail_triggered, reason)
        """
        # 1. Strip PII from output
        safe = self._redact_pii(llm_response)

        # 2. Check for forbidden topic leakage in output
        triggered, reason = self._check_forbidden_topics(safe)
        if triggered:
            safe = (
                "I'm sorry, but that topic is outside my area of expertise. "
                "Please consult the appropriate specialist."
            )
            return safe, True, reason

        # 3. Citation enforcement
        if self.citation_required:
            cite_triggered, cite_reason = self._check_citations(safe)
            if cite_triggered:
                logger.warning(f"Citation guardrail triggered: {cite_reason}")
                # We append a disclaimer rather than blocking the response entirely
                safe = safe + (
                    "\n\n⚠️ *Note: Some claims in this response could not be verified "
                    "with citations from the available documents. Please cross-check before use.*"
                )
                return safe, True, cite_reason

        return safe, False, None

    # ------------------------------------------------------------------
    # Citation parsing (called after validate())
    # ------------------------------------------------------------------

    def extract_citations(
        self, response_text: str, chunks: list[dict]
    ) -> list[Citation]:
        """
        Parses [Source: X, pg N] markers from the response and matches them
        to retrieved chunks to build Citation objects.
        """
        citations: list[Citation] = []
        seen = set()

        for match in CITATION_RE.finditer(response_text):
            source = match.group(1).strip()
            page = int(match.group(2))
            key = (source, page)

            if key in seen:
                continue
            seen.add(key)

            # Find matching chunk for excerpt
            excerpt = next(
                (c["text"][:200] for c in chunks
                 if c.get("source", "").lower() in source.lower() or
                 source.lower() in c.get("source", "").lower()),
                "See source document.",
            )
            citations.append(Citation(source=source, page=page, excerpt=excerpt))

        return citations

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _redact_pii(self, text: str) -> str:
        for pattern in self._pii_patterns:
            text = pattern.sub("[REDACTED]", text)
        return text

    def _check_forbidden_topics(self, text: str) -> tuple[bool, Optional[str]]:
        text_lower = text.lower()
        for topic in self.forbidden_topics:
            # Normalise topic string to keywords
            keywords = topic.lower().replace("_", " ").split()
            if all(kw in text_lower for kw in keywords):
                reason = f"Forbidden topic detected: '{topic}'"
                logger.info(reason)
                return True, reason
        return False, None

    def _check_citations(self, text: str) -> tuple[bool, Optional[str]]:
        """
        Heuristic: if the response contains sentences with factual-sounding language
        (numbers, technical terms, code references) but NO citation markers, flag it.
        """
        has_citation = bool(CITATION_RE.search(text))
        if has_citation:
            return False, None

        # Check if the response likely makes factual claims (numbers, code refs)
        factual_indicators = [
            r"\b\d+(\.\d+)?\s*(kN|kPa|MPa|psi|kip|ft|m|mm|in)\b",  # Engineering units
            r"\bAISC|ACI|ASCE|IBC|OSHA|29 CFR|Section \d+",          # Code references
            r"\bpolicy|clause|article|section\b",                      # Policy references
            r"\b\d{1,3}%\b",                                           # Percentages
        ]
        has_factual = any(
            re.search(ind, text, re.IGNORECASE) for ind in factual_indicators
        )

        if has_factual and not has_citation:
            return True, "Response contains factual claims without citations"

        return False, None
