"""
tool_injector.py — Hot-mounts only the tools authorized by the active plug's JSON config.
Uses FastAPI Depends() so tool selection happens per-request with zero restarts.
"""

from __future__ import annotations

import logging
from typing import Callable

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def beam_calculator_tool(
    span_m: float,
    load_kn: float,
    steel_grade: str = "A36",
) -> dict:
    """
    Simplified beam moment/shear calculator (demonstration).
    Returns max moment (kN·m) and max shear (kN) for a simply supported beam
    under a uniformly distributed load.
    """
    w = load_kn / span_m  # kN/m uniform load approximation
    max_moment = (w * span_m ** 2) / 8
    max_shear = w * span_m / 2
    return {
        "tool": "beam_calculator",
        "inputs": {"span_m": span_m, "load_kn": load_kn, "steel_grade": steel_grade},
        "max_moment_kNm": round(max_moment, 2),
        "max_shear_kN": round(max_shear, 2),
        "note": "Simplified UDL on simply supported beam. Use AISC for full design.",
    }


def load_estimator_tool(floor_area_m2: float, occupancy_type: str = "office") -> dict:
    """
    Estimates design live load per ASCE 7-22 Table 4.3-1.
    """
    # Simplified ASCE 7-22 reference loads (kPa)
    occupancy_loads = {
        "office": 2.4,
        "residential": 1.9,
        "assembly": 4.8,
        "storage_light": 6.0,
        "storage_heavy": 12.0,
        "retail": 4.8,
    }
    load_kpa = occupancy_loads.get(occupancy_type.lower(), 2.4)
    total_kn = load_kpa * floor_area_m2
    return {
        "tool": "load_estimator",
        "occupancy": occupancy_type,
        "unit_load_kPa": load_kpa,
        "total_load_kN": round(total_kn, 1),
        "reference": "[Source: ASCE 7-22, Table 4.3-1]",
    }


def code_lookup_tool(standard: str, section: str) -> dict:
    """
    Returns a stub reference for a given design standard section.
    In production, this would query an indexed document store.
    """
    return {
        "tool": "code_lookup",
        "standard": standard,
        "section": section,
        "result": f"See {standard} Section {section} for requirements. "
                  f"[Source: {standard}, pg TBD — retrieve from RAG for exact page]",
    }


def policy_lookup_tool(policy_name: str, keyword: str) -> dict:
    """Looks up an HR policy by name and keyword."""
    return {
        "tool": "policy_lookup",
        "policy": policy_name,
        "keyword": keyword,
        "result": f"Refer to {policy_name} under '{keyword}' section. "
                  f"[Source: {policy_name}, pg TBD]",
    }


def leave_calculator_tool(
    leave_type: str,
    days_requested: int,
    days_taken_ytd: int,
    entitlement_days: int,
) -> dict:
    """Calculates remaining leave balance."""
    remaining = entitlement_days - days_taken_ytd
    approved = min(days_requested, remaining)
    return {
        "tool": "leave_calculator",
        "leave_type": leave_type,
        "entitlement": entitlement_days,
        "taken_ytd": days_taken_ytd,
        "remaining_before": remaining,
        "requested": days_requested,
        "approved": approved,
        "status": "approved" if approved == days_requested else "partial",
    }


def benefits_lookup_tool(benefit_type: str, employee_level: str) -> dict:
    """Returns benefit entitlement summary."""
    return {
        "tool": "benefits_lookup",
        "benefit": benefit_type,
        "level": employee_level,
        "result": f"Benefits for {employee_level} regarding {benefit_type}: "
                  f"see HR Benefits Guide. [Source: HR Benefits Guide, pg TBD]",
    }


def statute_lookup_tool(jurisdiction: str, statute_ref: str) -> dict:
    """Looks up a legal statute reference."""
    return {
        "tool": "statute_lookup",
        "jurisdiction": jurisdiction,
        "statute": statute_ref,
        "result": f"Per {statute_ref} ({jurisdiction}): consult full text for specifics. "
                  f"[Source: {statute_ref}, pg TBD]",
    }


def clause_extractor_tool(contract_type: str, clause_name: str) -> dict:
    """Extracts a standard clause from a contract template."""
    return {
        "tool": "clause_extractor",
        "contract_type": contract_type,
        "clause": clause_name,
        "result": f"Standard {clause_name} clause for {contract_type}: see contract templates. "
                  f"[Source: Contract Template Library, pg TBD]",
    }


def compliance_checker_tool(regulation: str, activity: str) -> dict:
    """Checks basic compliance status for a regulation/activity pair."""
    return {
        "tool": "compliance_checker",
        "regulation": regulation,
        "activity": activity,
        "result": f"Compliance check for '{activity}' under {regulation}: "
                  f"review required. [Source: {regulation}, pg TBD]",
    }


# ---------------------------------------------------------------------------
# Registry — all tools available in the system
# ---------------------------------------------------------------------------

TOOL_REGISTRY: dict[str, Callable] = {
    "beam_calculator": beam_calculator_tool,
    "load_estimator": load_estimator_tool,
    "code_lookup": code_lookup_tool,
    "policy_lookup": policy_lookup_tool,
    "leave_calculator": leave_calculator_tool,
    "benefits_lookup": benefits_lookup_tool,
    "statute_lookup": statute_lookup_tool,
    "clause_extractor": clause_extractor_tool,
    "compliance_checker": compliance_checker_tool,
}


# ---------------------------------------------------------------------------
# Injector
# ---------------------------------------------------------------------------

class ToolInjector:
    """
    Returns only the Callable tools listed in the active plug's JSON config.
    This is the hot-mount mechanism — no restart needed when plug switches.
    """

    def get_tools_for_plug(self, plug_config: dict) -> list[Callable]:
        allowed_ids: list[str] = plug_config.get("tools", [])
        tools = []
        for tool_id in allowed_ids:
            if tool_id in TOOL_REGISTRY:
                tools.append(TOOL_REGISTRY[tool_id])
                logger.debug(f"Mounted tool: {tool_id}")
            else:
                logger.warning(f"Tool '{tool_id}' listed in plug config but not in registry")
        return tools

    def get_tool_names_for_plug(self, plug_config: dict) -> list[str]:
        """Returns just the string names — used by ContextEngine for prompt display."""
        return [t for t in plug_config.get("tools", []) if t in TOOL_REGISTRY]
