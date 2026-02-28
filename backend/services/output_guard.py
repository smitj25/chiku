"""
Output Guardrails — Post-generation safety layer.
Checks: hallucination scoring, policy compliance, citation presence.
"""
from __future__ import annotations
import re
import time
from models.schemas import GuardrailResult, GuardrailDecision, PersonaConfig


class OutputGuardService:
    """Post-generation output guardrails."""

    def check(
        self,
        response: str,
        retrieved_context: str,
        persona: PersonaConfig,
    ) -> tuple[GuardrailResult, float]:
        """
        Check the LLM response against output guardrail policies.
        Returns (GuardrailResult, hallucination_score).
        """
        checks: dict[str, bool] = {}
        details: dict[str, str] = {}

        # 1. Citation presence check
        citation_pattern = r'\[Source:\s*[^\]]+\]'
        citations_found = re.findall(citation_pattern, response)
        checks["has_citations"] = len(citations_found) > 0
        details["citation_count"] = str(len(citations_found))

        # 2. Hallucination score (what fraction of key claims are grounded in context)
        hallucination_score = self._estimate_hallucination(response, retrieved_context)
        checks["hallucination_acceptable"] = hallucination_score <= 0.30
        details["hallucination_score"] = f"{hallucination_score:.2f}"

        # 3. Disclaimer check (if required by persona)
        if persona.require_disclaimer:
            has_disclaimer = any(keyword in response.lower() for keyword in [
                "disclaimer", "subject to market risks", "consult",
                "not indicative of future", "read all scheme",
                "ai-assisted", "final determination",
            ])
            checks["disclaimer_present"] = has_disclaimer
        else:
            checks["disclaimer_present"] = True

        # 4. Blocked terms check
        if persona.blocked_terms:
            blocked = [t for t in persona.blocked_terms if t.lower() in response.lower()]
            checks["no_blocked_terms"] = len(blocked) == 0
            if blocked:
                details["blocked_terms_in_output"] = ", ".join(blocked)

        # 5. Response not empty
        checks["response_valid"] = len(response.strip()) > 20

        # Determine overall decision
        all_passed = all(checks.values())
        if not checks.get("hallucination_acceptable", True):
            decision = GuardrailDecision.BLOCKED
        elif not checks.get("no_blocked_terms", True):
            decision = GuardrailDecision.BLOCKED
        elif not all_passed:
            decision = GuardrailDecision.FLAGGED
        else:
            decision = GuardrailDecision.PASSED

        result = GuardrailResult(
            layer="output",
            decision=decision,
            checks=checks,
            details=details,
            timestamp=time.time(),
        )
        return result, hallucination_score

    def _estimate_hallucination(self, response: str, context: str) -> float:
        """
        Estimate hallucination as % of response sentences NOT grounded in context.
        Simple but effective heuristic for MVP.
        """
        if not context.strip():
            return 1.0

        # Split response into sentences
        sentences = re.split(r'[.!?]\s+', response)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]

        if not sentences:
            return 0.0

        context_lower = context.lower()
        ungrounded = 0

        for sentence in sentences:
            # Skip citation references and disclaimers
            if "[source:" in sentence.lower() or "disclaimer" in sentence.lower():
                continue

            # Extract key terms from the sentence
            terms = set(re.findall(r'\b[a-zA-Z]{4,}\b', sentence.lower()))
            stopwords = {"this", "that", "with", "from", "have", "been", "will", "they", "their", "what", "which", "when", "where", "must", "should", "could", "would", "also", "based", "about"}
            terms -= stopwords

            if not terms:
                continue

            # Check how many terms appear in context
            grounded_terms = sum(1 for t in terms if t in context_lower)
            grounding_ratio = grounded_terms / len(terms) if terms else 0

            if grounding_ratio < 0.3:
                ungrounded += 1

        return ungrounded / len(sentences) if sentences else 0.0


# Singleton
output_guard = OutputGuardService()
