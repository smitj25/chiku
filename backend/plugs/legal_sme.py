"""
legal_sme.py — Legal SME plug: agent factory for legal domain.
"""

from __future__ import annotations

import anthropic

from backend.agents.base_agent import SMEAgent
from backend.core.tool_injector import ToolInjector


def create_legal_agent(
    plug_config: dict,
    client: anthropic.Anthropic,
) -> SMEAgent:
    """
    Factory function: returns a fully configured Legal SME agent.
    """
    injector = ToolInjector()
    tools = injector.get_tools_for_plug(plug_config)
    return SMEAgent(plug_config=plug_config, tools=tools, client=client)
