"""
Citation Verifier — Extracts citations from LLM responses 
and verifies them against retrieved document sections.
"""
from __future__ import annotations
import re
from models.schemas import Citation, CitationStatus
from services.document_store import Section


class CitationVerifier:
    """Extracts and verifies citations from LLM responses."""

    def verify(
        self,
        response: str,
        retrieved_sections: list[Section],
    ) -> list[Citation]:
        """
        Parse citations from response and verify each against retrieved sections.
        """
        raw_citations = self._extract_citations(response)
        verified: list[Citation] = []

        for raw in raw_citations:
            citation = self._verify_single(raw, retrieved_sections)
            verified.append(citation)

        return verified

    def _extract_citations(self, response: str) -> list[dict]:
        """Extract citation references from the LLM response."""
        citations = []

        # Pattern: [Source: filename, Page X, Section Y]
        pattern = r'\[Source:\s*([^,\]]+?)(?:,\s*Page\s*(\d+))?(?:,\s*Section\s*([^\]]+))?\]'
        matches = re.finditer(pattern, response, re.IGNORECASE)

        for match in matches:
            # Find the claim (text preceding the citation)
            start = match.start()
            # Look backwards for sentence start
            text_before = response[:start]
            sentences = re.split(r'[.!?\n]', text_before)
            claim = sentences[-1].strip() if sentences else ""

            citations.append({
                "claim": claim,
                "source_file": match.group(1).strip(),
                "page": int(match.group(2)) if match.group(2) else None,
                "section": match.group(3).strip() if match.group(3) else None,
            })

        return citations

    def _verify_single(self, raw: dict, sections: list[Section]) -> Citation:
        """Verify a single citation against retrieved sections."""
        best_match: Section | None = None
        best_score = 0.0

        for section in sections:
            score = self._match_score(raw, section)
            if score > best_score:
                best_score = score
                best_match = section

        if best_match and best_score >= 0.7:
            status = CitationStatus.VERIFIED
        elif best_match and best_score >= 0.4:
            status = CitationStatus.PARTIAL
        else:
            status = CitationStatus.UNVERIFIED

        return Citation(
            claim=raw["claim"],
            source_file=raw["source_file"],
            page=raw.get("page") or (best_match.page if best_match else None),
            section=raw.get("section") or (best_match.title if best_match else None),
            node_id=best_match.node_id if best_match else None,
            status=status,
            confidence=best_score,
            source_text=best_match.content[:200] if best_match else None,
        )

    def _match_score(self, raw: dict, section: Section) -> float:
        """Score how well a citation matches a section."""
        score = 0.0

        # Filename match
        raw_file = raw["source_file"].lower().replace(" ", "_")
        section_file = section.filename.lower()
        if raw_file in section_file or section_file in raw_file:
            score += 0.3
        # Partial filename match
        elif any(part in section_file for part in raw_file.split("_") if len(part) > 3):
            score += 0.15

        # Page match
        if raw.get("page") and raw["page"] == section.page:
            score += 0.3

        # Section/title match
        if raw.get("section"):
            raw_sec = raw["section"].lower()
            sec_title = section.title.lower()
            if raw_sec in sec_title or sec_title in raw_sec:
                score += 0.2

        # Content match — check if claim keywords appear in section
        if raw.get("claim"):
            claim_terms = set(re.findall(r'\b[a-zA-Z]{4,}\b', raw["claim"].lower()))
            stopwords = {"this", "that", "with", "from", "have", "been", "will", "they", "their", "what", "which"}
            claim_terms -= stopwords
            content_lower = section.content.lower()
            if claim_terms:
                found = sum(1 for t in claim_terms if t in content_lower)
                score += 0.2 * (found / len(claim_terms))

        return min(score, 1.0)


# Singleton
citation_verifier = CitationVerifier()
