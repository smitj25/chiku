"""Pydantic schemas for SME-Plug API."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid
import time


# -- Enums --

class GuardrailLevel(str, Enum):
    STRICT = "strict"
    MODERATE = "moderate"
    RELAXED = "relaxed"


class CitationStatus(str, Enum):
    VERIFIED = "verified"
    PARTIAL = "partial"
    UNVERIFIED = "unverified"


class GuardrailDecision(str, Enum):
    PASSED = "passed"
    BLOCKED = "blocked"
    FLAGGED = "flagged"


# -- Namespace / Persona --

class PersonaConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    description: str
    corpus_files: list[str] = Field(default_factory=list)
    allowed_topics: list[str] = Field(default_factory=list)
    guardrail_level: GuardrailLevel = GuardrailLevel.STRICT
    system_prompt_override: Optional[str] = None
    require_disclaimer: bool = True
    blocked_terms: list[str] = Field(default_factory=list)


class NamespaceSwitch(BaseModel):
    persona_id: str


# -- Query / Response --

class QueryRequest(BaseModel):
    text: str
    persona_id: Optional[str] = None
    compare_mode: bool = False  # Side-by-side comparison with vanilla LLM


class Citation(BaseModel):
    claim: str
    source_file: str
    page: Optional[int] = None
    section: Optional[str] = None
    node_id: Optional[str] = None
    status: CitationStatus = CitationStatus.UNVERIFIED
    confidence: float = 0.0
    source_text: Optional[str] = None


class GuardrailResult(BaseModel):
    layer: str  # "input" or "output"
    decision: GuardrailDecision
    checks: dict[str, bool] = Field(default_factory=dict)
    details: dict[str, str] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)


class PipelineStep(BaseModel):
    name: str
    status: str  # "passed", "failed", "skipped"
    duration_ms: float = 0.0
    details: Optional[str] = None


class QueryResponse(BaseModel):
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    response_text: str
    citations: list[Citation] = Field(default_factory=list)
    input_guardrail: Optional[GuardrailResult] = None
    output_guardrail: Optional[GuardrailResult] = None
    pipeline_steps: list[PipelineStep] = Field(default_factory=list)
    hallucination_score: float = 0.0
    persona_id: str = ""
    persona_name: str = ""
    total_duration_ms: float = 0.0


class ComparisonResponse(BaseModel):
    query_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vanilla_response: str
    vanilla_duration_ms: float = 0.0
    smeplug_response: QueryResponse
    persona_name: str = ""


# -- Audit --

class AuditEntry(BaseModel):
    query_id: str
    timestamp: float = Field(default_factory=time.time)
    persona_id: str
    persona_name: str
    query_text: str
    retrieved_sections: list[dict] = Field(default_factory=list)
    raw_llm_response: str = ""
    final_response: str = ""
    citations: list[Citation] = Field(default_factory=list)
    input_guardrail: Optional[GuardrailResult] = None
    output_guardrail: Optional[GuardrailResult] = None
    hallucination_score: float = 0.0
    pipeline_steps: list[PipelineStep] = Field(default_factory=list)
