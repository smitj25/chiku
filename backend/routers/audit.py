"""Audit router — View query audit trails."""
from fastapi import APIRouter, HTTPException
from services.pipeline import get_audit_log, get_audit_entry

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/")
async def list_audit_entries():
    """List all audit entries (most recent first)."""
    log = get_audit_log()
    return {
        "total": len(log),
        "entries": [
            {
                "query_id": e.query_id,
                "timestamp": e.timestamp,
                "persona_name": e.persona_name,
                "query_text": e.query_text[:100] + "..." if len(e.query_text) > 100 else e.query_text,
                "hallucination_score": e.hallucination_score,
                "citation_count": len(e.citations),
            }
            for e in reversed(log)
        ],
    }


@router.get("/{query_id}")
async def get_audit_detail(query_id: str):
    """Get full audit trail for a specific query."""
    entry = get_audit_entry(query_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Audit entry '{query_id}' not found")
    return entry.model_dump()
