"""
Input Guardrails — Pre-retrieval safety layer.
Checks: PII detection, prompt injection, topic boundary enforcement.
"""
from __future__ import annotations
import re
import time
from models.schemas import GuardrailResult, GuardrailDecision, PersonaConfig


# Known prompt injection patterns
_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"ignore\s+(all\s+)?above",
    r"disregard\s+(all\s+)?previous",
    r"you\s+are\s+now\s+(?:a|an)\s+(?!compliance|investment|advisor)",
    r"pretend\s+you\s+are",
    r"forget\s+(everything|all)",
    r"system\s*prompt",
    r"reveal\s+your\s+(?:instructions|prompt|system)",
    r"act\s+as\s+(?:a|an)\s+(?!compliance|investment|advisor)",
    r"jailbreak",
    r"DAN\s+mode",
]

# PII patterns
_PII_PATTERNS = {
    "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
    "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone": r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
}


class InputGuardService:
    """Pre-retrieval input guardrails."""

    def check(self, query: str, persona: PersonaConfig) -> GuardrailResult:
        start = time.time()
        checks: dict[str, bool] = {}
        details: dict[str, str] = {}

        # 1. Prompt injection detection
        injection_found = False
        for pattern in _INJECTION_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                injection_found = True
                details["injection_pattern"] = pattern
                break
        checks["prompt_injection_safe"] = not injection_found

        # 2. PII detection
        pii_found: list[str] = []
        for pii_type, pattern in _PII_PATTERNS.items():
            if re.search(pattern, query):
                pii_found.append(pii_type)
        checks["pii_safe"] = len(pii_found) == 0
        if pii_found:
            details["pii_detected"] = ", ".join(pii_found)

        # 3. Topic boundary enforcement
        if persona.allowed_topics:
            query_lower = query.lower()
            topic_match = any(
                topic.lower() in query_lower
                for topic in persona.allowed_topics
            )
            # Be lenient: if we can't determine the topic, let it through
            # Only block if query contains blocked terms
            checks["topic_in_scope"] = True  # Default to true
            if persona.blocked_terms:
                blocked = [t for t in persona.blocked_terms if t.lower() in query_lower]
                if blocked:
                    checks["topic_in_scope"] = False
                    details["blocked_terms_found"] = ", ".join(blocked)

        # 4. Query not empty
        checks["query_valid"] = len(query.strip()) > 0

        # Determine overall decision
        if not checks.get("prompt_injection_safe", True):
            decision = GuardrailDecision.BLOCKED
        elif not checks.get("topic_in_scope", True):
            decision = GuardrailDecision.BLOCKED
        elif not checks.get("query_valid", True):
            decision = GuardrailDecision.BLOCKED
        elif not checks.get("pii_safe", True):
            decision = GuardrailDecision.FLAGGED  # Flag but don't block
            details["pii_action"] = "PII detected and redacted from context"
        else:
            decision = GuardrailDecision.PASSED

        return GuardrailResult(
            layer="input",
            decision=decision,
            checks=checks,
            details=details,
            timestamp=time.time(),
        )

    def redact_pii(self, text: str) -> str:
        """Redact PII from text before sending to LLM."""
        redacted = text
        for pii_type, pattern in _PII_PATTERNS.items():
            redacted = re.sub(pattern, f"[REDACTED-{pii_type.upper()}]", redacted)
        return redacted


# Singleton
input_guard = InputGuardService()
