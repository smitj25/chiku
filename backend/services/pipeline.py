"""
Pipeline Orchestrator — The main query processing pipeline.
Input → Guardrails → Retrieval → LLM → Citation Verification → Output Guardrails → Response
"""
from __future__ import annotations
import time
import uuid

from models.schemas import (
    QueryRequest, QueryResponse, ComparisonResponse,
    PipelineStep, AuditEntry,
    GuardrailDecision,
)
from services.namespace_manager import namespace_manager
from services.retriever import retriever_service
from services.llm_service import llm_service
from services.input_guard import input_guard
from services.output_guard import output_guard
from services.citation_verifier import citation_verifier


# In-memory audit log
_audit_log: list[AuditEntry] = []


def get_audit_log() -> list[AuditEntry]:
    return _audit_log


def get_audit_entry(query_id: str) -> AuditEntry | None:
    for entry in _audit_log:
        if entry.query_id == query_id:
            return entry
    return None


async def process_query(request: QueryRequest) -> QueryResponse | ComparisonResponse:
    """
    Main pipeline: process a user query through the full SME-Plug pipeline.
    """
    start_time = time.time()
    query_id = str(uuid.uuid4())
    steps: list[PipelineStep] = []

    # --- Resolve persona ---
    if request.persona_id:
        namespace_manager.switch_persona(request.persona_id)
    persona = namespace_manager.get_active_persona()
    if not persona:
        return QueryResponse(
            query_id=query_id,
            response_text="Error: No active persona configured.",
            persona_id="",
            persona_name="Unknown",
        )

    # --- Step 1: Input Guardrails ---
    step_start = time.time()
    input_result = input_guard.check(request.text, persona)
    steps.append(PipelineStep(
        name="Input Guardrails",
        status=input_result.decision.value,
        duration_ms=(time.time() - step_start) * 1000,
        details=f"Checks: {input_result.checks}",
    ))

    if input_result.decision == GuardrailDecision.BLOCKED:
        return QueryResponse(
            query_id=query_id,
            response_text=f"🚫 Query blocked by input guardrails. Reason: {input_result.details}",
            input_guardrail=input_result,
            pipeline_steps=steps,
            persona_id=persona.id,
            persona_name=persona.name,
            total_duration_ms=(time.time() - start_time) * 1000,
        )

    # Redact PII if flagged
    clean_query = request.text
    if input_result.decision == GuardrailDecision.FLAGGED:
        clean_query = input_guard.redact_pii(request.text)

    # --- Step 2: Retrieval ---
    step_start = time.time()
    retrieved = retriever_service.retrieve(clean_query, persona.id, top_k=5)
    sections = [r.section for r in retrieved]
    steps.append(PipelineStep(
        name="Document Retrieval",
        status="passed" if sections else "no_results",
        duration_ms=(time.time() - step_start) * 1000,
        details=f"Retrieved {len(sections)} sections from {len(set(s.filename for s in sections))} documents",
    ))

    # --- Step 3: LLM Generation ---
    step_start = time.time()
    system_prompt = persona.system_prompt_override or (
        f"You are {persona.name}. {persona.description}. "
        "Cite all sources using [Source: filename, Page X, Section Y] format."
    )

    raw_response, llm_duration = llm_service.generate(
        query=clean_query,
        context_sections=sections,
        system_prompt=system_prompt,
    )
    steps.append(PipelineStep(
        name="LLM Generation",
        status="passed",
        duration_ms=llm_duration,
        details=f"Provider: {persona.id}, Response length: {len(raw_response)} chars",
    ))

    # --- Step 4: Citation Verification ---
    step_start = time.time()
    citations = citation_verifier.verify(raw_response, sections)
    steps.append(PipelineStep(
        name="Citation Verification",
        status="passed",
        duration_ms=(time.time() - step_start) * 1000,
        details=f"Verified {len(citations)} citations",
    ))

    # --- Step 5: Output Guardrails ---
    step_start = time.time()
    context_text = "\n\n".join(s.content for s in sections)
    output_result, hallucination_score = output_guard.check(
        raw_response, context_text, persona,
    )
    steps.append(PipelineStep(
        name="Output Guardrails",
        status=output_result.decision.value,
        duration_ms=(time.time() - step_start) * 1000,
        details=f"Hallucination score: {hallucination_score:.2f}",
    ))

    total_duration = (time.time() - start_time) * 1000

    # --- Build response ---
    smeplug_response = QueryResponse(
        query_id=query_id,
        response_text=raw_response,
        citations=citations,
        input_guardrail=input_result,
        output_guardrail=output_result,
        pipeline_steps=steps,
        hallucination_score=hallucination_score,
        persona_id=persona.id,
        persona_name=persona.name,
        total_duration_ms=total_duration,
    )

    # --- Audit log ---
    audit_entry = AuditEntry(
        query_id=query_id,
        persona_id=persona.id,
        persona_name=persona.name,
        query_text=request.text,
        retrieved_sections=[
            {"filename": s.filename, "page": s.page, "title": s.title, "node_id": s.node_id}
            for s in sections
        ],
        raw_llm_response=raw_response,
        final_response=raw_response,
        citations=citations,
        input_guardrail=input_result,
        output_guardrail=output_result,
        hallucination_score=hallucination_score,
        pipeline_steps=steps,
    )
    _audit_log.append(audit_entry)

    # --- Comparison mode ---
    if request.compare_mode:
        vanilla_start = time.time()
        vanilla_response, vanilla_duration = llm_service.generate_vanilla(request.text)
        return ComparisonResponse(
            query_id=query_id,
            vanilla_response=vanilla_response,
            vanilla_duration_ms=vanilla_duration,
            smeplug_response=smeplug_response,
            persona_name=persona.name,
        )

    return smeplug_response
