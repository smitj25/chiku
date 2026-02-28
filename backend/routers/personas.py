"""Personas router — List, switch, and manage personas/namespaces."""
from fastapi import APIRouter, HTTPException
from models.schemas import PersonaConfig, NamespaceSwitch
from services.namespace_manager import namespace_manager
from services.retriever import retriever_service
import time

router = APIRouter(prefix="/api/personas", tags=["personas"])


@router.get("/")
async def list_personas():
    """List all available personas with the active one marked."""
    personas = namespace_manager.list_personas()
    active = namespace_manager.get_active_persona()
    return {
        "personas": [p.model_dump() for p in personas],
        "active_persona_id": active.id if active else None,
    }


@router.get("/{persona_id}")
async def get_persona(persona_id: str):
    """Get details of a specific persona."""
    persona = namespace_manager.get_persona(persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    active = namespace_manager.get_active_persona()
    return {
        "persona": persona.model_dump(),
        "is_active": active and active.id == persona_id,
    }


@router.put("/switch")
async def switch_persona(switch: NamespaceSwitch):
    """
    Hot-swap the active persona. This changes the corpus, guardrails,
    and system prompt — instantly, without restarting the LLM context.
    """
    start = time.time()
    try:
        persona = namespace_manager.switch_persona(switch.persona_id)
        switch_time_ms = (time.time() - start) * 1000
        return {
            "status": "switched",
            "persona": persona.model_dump(),
            "switch_time_ms": round(switch_time_ms, 2),
            "message": f"Switched to '{persona.name}' in {switch_time_ms:.1f}ms",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/")
async def create_persona(config: PersonaConfig):
    """Create a new persona/namespace."""
    persona = namespace_manager.create_persona(config)
    retriever_service.invalidate_cache(persona.id)
    return {"status": "created", "persona": persona.model_dump()}
