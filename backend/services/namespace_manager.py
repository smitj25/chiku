"""
Namespace Manager — Manages personas by mapping each to a corpus, 
guardrail config, and allowed topics. Supports instant hot-swapping.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Optional

from config import NAMESPACES_FILE, CORPORA_DIR
from models.schemas import PersonaConfig, GuardrailLevel


# Default personas for the demo
_DEFAULT_PERSONAS: list[dict] = [
    {
        "id": "compliance",
        "name": "Compliance Officer",
        "description": "OFAC/AML sanctions screening and compliance guidance",
        "corpus_files": ["OFAC_SDN_List_2026_Feb.txt", "AML_Policy_v3.txt"],
        "allowed_topics": [
            "sanctions", "OFAC", "SDN", "AML", "KYC", "PEP",
            "screening", "compliance", "penalties", "reporting",
            "transaction monitoring", "suspicious activity",
        ],
        "guardrail_level": "strict",
        "require_disclaimer": True,
        "blocked_terms": ["investment advice", "buy", "sell", "recommend stock"],
        "system_prompt_override": (
            "You are a Compliance Officer AI assistant. You ONLY answer questions about "
            "OFAC sanctions, AML policy, KYC requirements, and compliance procedures. "
            "Every factual claim MUST include a citation in the format "
            "[Source: filename, Page X, Section Y]. "
            "If the information is not in the provided documents, say so explicitly. "
            "Never speculate or provide information from outside the provided documents."
        ),
    },
    {
        "id": "advisor",
        "name": "Investment Advisor",
        "description": "Investment product recommendations and fund information",
        "corpus_files": ["Product_Catalog_Q4.txt", "Risk_Disclosures.txt"],
        "allowed_topics": [
            "mutual funds", "SIP", "investment", "portfolio",
            "risk profile", "returns", "NAV", "expense ratio",
            "debt funds", "equity funds", "hybrid funds",
        ],
        "guardrail_level": "strict",
        "require_disclaimer": True,
        "blocked_terms": ["guaranteed returns", "risk-free", "100% safe", "no loss"],
        "system_prompt_override": (
            "You are an Investment Advisor AI assistant. You help clients find suitable "
            "investment products based on their risk profile. Every product recommendation "
            "MUST include a citation in the format [Source: filename, Page X, Section Y]. "
            "You MUST include the disclaimer: 'Mutual fund investments are subject to market risks. "
            "Read all scheme-related documents carefully before investing.' "
            "Never guarantee returns or claim any investment is risk-free."
        ),
    },
]


class NamespaceManager:
    """Manages persona/namespace registry with hot-swap support."""

    def __init__(self):
        self._personas: dict[str, PersonaConfig] = {}
        self._active_persona_id: Optional[str] = None

    # -- Persistence --

    def load(self):
        """Load personas from disk or initialize with defaults."""
        if NAMESPACES_FILE.exists():
            with open(NAMESPACES_FILE, "r") as f:
                data = json.load(f)
            for item in data:
                p = PersonaConfig(**item)
                self._personas[p.id] = p
        else:
            for item in _DEFAULT_PERSONAS:
                p = PersonaConfig(**item)
                self._personas[p.id] = p
            self._save()

        # Default active persona
        if not self._active_persona_id and self._personas:
            self._active_persona_id = list(self._personas.keys())[0]

    def _save(self):
        """Persist personas to disk."""
        NAMESPACES_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = [p.model_dump() for p in self._personas.values()]
        with open(NAMESPACES_FILE, "w") as f:
            json.dump(data, f, indent=2)

    # -- CRUD --

    def list_personas(self) -> list[PersonaConfig]:
        return list(self._personas.values())

    def get_persona(self, persona_id: str) -> Optional[PersonaConfig]:
        return self._personas.get(persona_id)

    def get_active_persona(self) -> Optional[PersonaConfig]:
        if self._active_persona_id:
            return self._personas.get(self._active_persona_id)
        return None

    def switch_persona(self, persona_id: str) -> PersonaConfig:
        """Hot-swap the active persona. Returns the new active persona."""
        if persona_id not in self._personas:
            raise ValueError(f"Persona '{persona_id}' not found")
        self._active_persona_id = persona_id
        return self._personas[persona_id]

    def create_persona(self, config: PersonaConfig) -> PersonaConfig:
        self._personas[config.id] = config
        self._save()
        return config

    # -- Corpus Access --

    def get_corpus_paths(self, persona_id: Optional[str] = None) -> list[Path]:
        """Return full file paths for the active persona's corpus."""
        pid = persona_id or self._active_persona_id
        if not pid:
            return []
        persona = self._personas.get(pid)
        if not persona:
            return []
        return [CORPORA_DIR / f for f in persona.corpus_files if (CORPORA_DIR / f).exists()]

    def get_corpus_texts(self, persona_id: Optional[str] = None) -> dict[str, str]:
        """Load and return corpus texts keyed by filename."""
        paths = self.get_corpus_paths(persona_id)
        texts = {}
        for p in paths:
            texts[p.name] = p.read_text(encoding="utf-8")
        return texts


# Singleton
namespace_manager = NamespaceManager()
