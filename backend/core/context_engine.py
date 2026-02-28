"""
context_engine.py — Assembles the final LLM system prompt from three layers:
  STATE   = session history + active plug + user preferences
  STORE   = retrieved RAG chunks (injected per query)
  RUNTIME = current plug persona, tools, rules, timestamp
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from backend.core.state_manager import SessionState

logger = logging.getLogger(__name__)


class ContextEngine:
    """
    Builds the complete system prompt that is sent to Claude on every turn.

    Prompt structure (top-to-bottom = highest to lowest priority):
    1. Persona block       — who the model IS
    2. RAG source block    — ONLY these docs, with citation rule
    3. Rules block         — forbidden topics, citation enforcement
    4. Tools block         — what tools are available
    5. History block       — last 10 conversation turns
    6. Runtime block       — timestamp, active plug name
    """

    def build_system_prompt(
        self,
        state: SessionState,
        plug_config: dict,
        rag_chunks: list[dict],
        available_tools: list[str],
    ) -> str:
        sections = [
            self._persona_block(plug_config),
            self._rag_block(rag_chunks, plug_config),
            self._rules_block(plug_config),
            self._tools_block(available_tools, plug_config),
            self._history_block(state),
            self._runtime_block(state, plug_config),
        ]
        prompt = "\n\n---\n\n".join(s for s in sections if s)
        logger.debug(f"System prompt built ({len(prompt)} chars) for plug={plug_config['plug_id']}")
        return prompt

    # ------------------------------------------------------------------
    # Private block builders
    # ------------------------------------------------------------------

    def _persona_block(self, cfg: dict) -> str:
        return f"## YOUR IDENTITY\n{cfg.get('persona', 'You are a helpful assistant.')}"

    def _rag_block(self, chunks: list[dict], cfg: dict) -> str:
        if not chunks:
            if cfg.get("citation_required"):
                return (
                    "## SOURCE DOCUMENTS\n"
                    "No documents were retrieved for this query. "
                    "If you are asked for facts, you MUST say: "
                    "'I cannot verify this from the available documents.'"
                )
            return ""

        lines = [
            "## SOURCE DOCUMENTS",
            "You MUST use ONLY the following excerpts as factual sources.",
            "For every factual claim, append the citation immediately after: [Source: <filename>, pg <N>].",
            "Do NOT introduce facts not present in these excerpts.\n",
        ]
        for i, chunk in enumerate(chunks, 1):
            lines.append(
                f"### Excerpt {i} — [Source: {chunk['source']}, pg {chunk['page']}]\n"
                f"{chunk['text'].strip()}"
            )
        lines.append(
            "\n⚠️ CITATION RULE: Every sentence containing a factual claim MUST end with "
            "[Source: <filename>, pg <N>]. No citation = do not make the claim."
        )
        return "\n".join(lines)

    def _rules_block(self, cfg: dict) -> str:
        forbidden = cfg.get("forbidden_topics", [])
        response_rules = cfg.get("response_rules", [])

        lines = ["## RULES YOU MUST FOLLOW"]

        if forbidden:
            topics_str = ", ".join(f"'{t}'" for t in forbidden)
            lines.append(
                f"1. FORBIDDEN TOPICS — Never answer questions about: {topics_str}. "
                "If asked, respond: 'This is outside my area of expertise. "
                "Please consult the appropriate specialist.'"
            )

        if response_rules:
            lines.append("2. RESPONSE RULES:")
            for rule in response_rules:
                lines.append(f"   - {rule}")

        lines.append(
            "3. HALLUCINATION PREVENTION — Never fabricate numbers, standards references, "
            "policy clauses, or document names. If uncertain, say so explicitly."
        )
        lines.append(
            "4. PII — Never repeat personally identifiable information (SSNs, credit cards, "
            "emails, phone numbers) back to the user."
        )
        return "\n".join(lines)

    def _tools_block(self, tools: list[str], cfg: dict) -> str:
        if not tools:
            return ""
        tool_list = "\n".join(f"  - {t}" for t in tools)
        return (
            f"## AVAILABLE TOOLS\n"
            f"You have access to the following tools for this plug ({cfg['plug_id']}):\n"
            f"{tool_list}\n"
            f"Use tools when a calculation or lookup is needed. "
            f"Always show the tool result inline and cite it as [Tool: <tool_name>]."
        )

    def _history_block(self, state: SessionState) -> str:
        messages = state.recent_messages(10)
        if not messages:
            return ""

        lines = ["## CONVERSATION HISTORY (last turns)"]
        for msg in messages:
            role = msg["role"].capitalize()
            content = msg["content"]
            # Skip internal system markers from the prompt (they're for state tracking)
            if msg["role"] == "system" and content.startswith("[PLUG SWITCH"):
                lines.append(f"[Note: {content}]")
            else:
                lines.append(f"**{role}:** {content}")
        return "\n".join(lines)

    def _runtime_block(self, state: SessionState, cfg: dict) -> str:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return (
            f"## RUNTIME CONTEXT\n"
            f"- Active plug: {cfg['plug_id']}\n"
            f"- Domain: {cfg.get('domain', 'unknown')}\n"
            f"- Session ID: {state.session_id}\n"
            f"- Current timestamp: {now}\n"
            f"- Citation required: {cfg.get('citation_required', True)}"
        )
