"""
base_agent.py — Generic LangChain-based SME agent wrapper.
One agent instance per request; tools and system prompt are injected per plug.
Handles transfer/handoff exceptions to trigger cross-domain plug switching.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Callable, Optional

import anthropic

from backend.config import settings
from backend.core.state_manager import SessionState
from backend.schemas import HandoffPayload

logger = logging.getLogger(__name__)


@dataclass
class TransferRequest(Exception):
    """Raised by a transfer tool to signal a cross-domain handoff."""
    target_plug: str
    source_plug: str
    transferred_context: str
    original_query: str = ""


class SMEAgent:
    """
    Wraps Anthropic's tool-calling API.
    Executes the agentic loop: LLM → tool call → tool result → LLM until done.
    """

    def __init__(self, plug_config: dict, tools: list[Callable], client: anthropic.Anthropic):
        self.plug_config = plug_config
        self.tools = tools
        self.client = client
        self._tool_map = {fn.__name__: fn for fn in tools}

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    async def run(
        self,
        query: str,
        state: SessionState,
        system_prompt: str,
    ) -> tuple[str, Optional[HandoffPayload]]:
        """
        Runs the agentic loop for a single user turn.
        Returns: (final_text_reply, handoff_payload_or_None)
        """
        messages = self._build_messages(state, query)
        anthropic_tools = self._build_anthropic_tools()

        try:
            response = self.client.messages.create(
                model=settings.model_name,
                max_tokens=settings.max_tokens,
                system=system_prompt,
                tools=anthropic_tools if anthropic_tools else anthropic.NOT_GIVEN,
                messages=messages,
            )
        except anthropic.APIError as e:
            logger.error(f"Anthropic API error: {e}")
            raise

        # Agentic tool-call loop
        return await self._process_response(response, messages, system_prompt, anthropic_tools, query, state)

    # ------------------------------------------------------------------
    # Private
    # ------------------------------------------------------------------

    async def _process_response(
        self,
        response,
        messages: list[dict],
        system_prompt: str,
        anthropic_tools: list[dict],
        original_query: str,
        state: SessionState,
        depth: int = 0,
    ) -> tuple[str, Optional[HandoffPayload]]:
        MAX_DEPTH = 5  # prevent infinite tool loops

        if response.stop_reason == "end_turn" or depth >= MAX_DEPTH:
            text = next(
                (b.text for b in response.content if hasattr(b, "text")),
                "I was unable to generate a response.",
            )
            return text, None

        if response.stop_reason == "tool_use":
            tool_results = []
            handoff: Optional[HandoffPayload] = None

            for block in response.content:
                if block.type != "tool_use":
                    continue

                tool_name = block.name
                tool_input = block.input
                tool_use_id = block.id

                logger.info(f"Agent calling tool: {tool_name}({tool_input})")

                # Check for transfer tools
                if tool_name.startswith("transfer_to_"):
                    target = tool_name.replace("transfer_to_", "") + "_sme"
                    handoff = HandoffPayload(
                        source_plug=self.plug_config["plug_id"],
                        target_plug=target,
                        session_id=state.session_id,
                        transferred_context=state.conversation_summary(),
                        original_query=original_query,
                    )
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": f"Transfer initiated to {target}.",
                    })
                    continue

                # Execute the tool
                try:
                    fn = self._tool_map.get(tool_name)
                    if fn:
                        result = fn(**tool_input)
                        result_str = json.dumps(result)
                    else:
                        result_str = f"Tool '{tool_name}' not found."
                        logger.warning(result_str)
                except Exception as e:
                    result_str = f"Tool error: {e}"
                    logger.error(result_str)

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use_id,
                    "content": result_str,
                })

            # If handoff was requested, return immediately
            if handoff:
                return "", handoff

            # Continue agentic loop with tool results
            messages = messages + [
                {"role": "assistant", "content": response.content},
                {"role": "user", "content": tool_results},
            ]
            next_response = self.client.messages.create(
                model=settings.model_name,
                max_tokens=settings.max_tokens,
                system=system_prompt,
                tools=anthropic_tools if anthropic_tools else anthropic.NOT_GIVEN,
                messages=messages,
            )
            return await self._process_response(
                next_response, messages, system_prompt, anthropic_tools,
                original_query, state, depth + 1
            )

        # Unexpected stop reason
        text = next((b.text for b in response.content if hasattr(b, "text")), "")
        return text, None

    def _build_messages(self, state: SessionState, query: str) -> list[dict]:
        """Build the messages list from session history + new user query."""
        messages = []
        for msg in state.recent_messages(8):
            if msg["role"] in ("user", "assistant"):
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": query})
        return messages

    def _build_anthropic_tools(self) -> list[dict]:
        """Convert Python callables to Anthropic tool schema format."""
        import inspect
        tools = []
        for fn in self.tools:
            sig = inspect.signature(fn)
            properties = {}
            required = []
            for param_name, param in sig.parameters.items():
                prop: dict = {"type": "string", "description": param_name}
                if param.annotation == float:
                    prop["type"] = "number"
                elif param.annotation == int:
                    prop["type"] = "integer"
                elif param.annotation == bool:
                    prop["type"] = "boolean"
                properties[param_name] = prop
                if param.default is inspect.Parameter.empty:
                    required.append(param_name)

            tools.append({
                "name": fn.__name__,
                "description": (fn.__doc__ or "").strip().split("\n")[0],
                "input_schema": {
                    "type": "object",
                    "properties": properties,
                    "required": required,
                },
            })

        # Always inject transfer tools based on plug config handoff triggers
        plug_id = self.plug_config.get("plug_id", "")
        if plug_id == "engineering_sme":
            tools.append(self._transfer_tool_schema("hr"))
            tools.append(self._transfer_tool_schema("legal"))
        elif plug_id == "hr_sme":
            tools.append(self._transfer_tool_schema("engineering"))
            tools.append(self._transfer_tool_schema("legal"))
        elif plug_id == "legal_sme":
            tools.append(self._transfer_tool_schema("engineering"))
            tools.append(self._transfer_tool_schema("hr"))

        return tools

    @staticmethod
    def _transfer_tool_schema(target: str) -> dict:
        return {
            "name": f"transfer_to_{target}",
            "description": (
                f"Transfer the user to the {target.upper()} SME agent when their question "
                f"is better handled by that domain. Call this when the query clearly belongs "
                f"to {target} territory. Pass a brief context summary."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "context": {
                        "type": "string",
                        "description": "Brief summary of the conversation so far for the new agent.",
                    }
                },
                "required": ["context"],
            },
        }
