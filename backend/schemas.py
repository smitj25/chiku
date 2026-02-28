"""
schemas.py — Pydantic v2 models for all API request/response contracts.
Import these in route handlers and agents — never define ad-hoc dicts in routes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier (UUID recommended)")
    message: str = Field(..., min_length=1, max_length=4096)
    plug_name: str = Field(default="engineering_sme")


class Citation(BaseModel):
    source: str = Field(..., description="Document filename or title")
    page: int = Field(..., ge=1)
    excerpt: str = Field(..., description="Verbatim chunk used as evidence")


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    citations: list[Citation] = Field(default_factory=list)
    active_plug: str
    guardrail_triggered: bool = False
    guardrail_reason: Optional[str] = None
    faithfulness_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Plug switching
# ---------------------------------------------------------------------------

class SwitchPlugRequest(BaseModel):
    session_id: str
    new_plug: str = Field(..., description="Target plug ID, e.g. 'hr_sme'")


class SwitchPlugResponse(BaseModel):
    session_id: str
    active_plug: str
    previous_plug: str
    context_preserved: bool = True
    message: str = "Plug switched successfully"


# ---------------------------------------------------------------------------
# Plug listing
# ---------------------------------------------------------------------------

class PlugInfo(BaseModel):
    plug_id: str
    domain: str
    persona_summary: str
    tools: list[str]
    chroma_namespace: str


class PlugListResponse(BaseModel):
    plugs: list[PlugInfo]
    active_plug: str


# ---------------------------------------------------------------------------
# RAG / Retriever
# ---------------------------------------------------------------------------

class RetrievedChunk(BaseModel):
    text: str
    source: str
    page: int
    score: float = Field(..., ge=0.0, le=1.0)
    namespace: str


# ---------------------------------------------------------------------------
# Agent handoff (internal — used between agents, not exposed via API)
# ---------------------------------------------------------------------------

class HandoffPayload(BaseModel):
    source_plug: str
    target_plug: str
    session_id: str
    transferred_context: str = Field(..., description="Conversation summary for new agent")
    original_query: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str = "ok"
    active_plug: str
    chroma_connected: bool
    session_count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
