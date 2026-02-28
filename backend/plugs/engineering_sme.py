"""
engineering_sme.py — Engineering SME plug: tool definitions and agent factory.
Extends the base SMEAgent with engineering-specific tool wrappers.
"""

from __future__ import annotations

import anthropic

from backend.agents.base_agent import SMEAgent
from backend.core.tool_injector import ToolInjector
from backend.core.state_manager import SessionState
from backend.config import settings


def create_engineering_agent(
    plug_config: dict,
    client: anthropic.Anthropic,
) -> SMEAgent:
    """
    Factory function: returns a fully configured Engineering SME agent.
    Tool selection is delegated to ToolInjector (reads from plug JSON config).
    """
    injector = ToolInjector()
    tools = injector.get_tools_for_plug(plug_config)
    return SMEAgent(plug_config=plug_config, tools=tools, client=client)
