<<<<<<< Updated upstream
import os
from pydantic import BaseModel
from typing import Literal

class Settings(BaseModel):
    # App Settings
    PROJECT_NAME: str = "SME-Plug MVP"
    
    # Model Configs - Updated for Hackathon Pivot
    LLM_PROVIDER: Literal["gemini", "groq"] = os.getenv("LLM_PROVIDER", "gemini")
    
    # Fallback to gemini-2.5-pro or llama3-70b depending on provider
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.5-pro") 
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    
    # Paths
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "./data/chroma")
    PLUGS_DIR: str = os.getenv("PLUGS_DIR", "./data/plugs")
    DOCS_DIR: str = os.getenv("DOCS_DIR", "./data/docs")
    
    # RAGAS Targets
    TARGET_FAITHFULNESS: float = 0.90
    TARGET_CONTEXT_PRECISION: float = 0.88

settings = Settings()
=======
"""
config.py — Single source of truth for all environment variables and model settings.
All modules import `settings` from here. No scattered os.getenv() calls.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM
    anthropic_api_key: str
    openai_api_key: str = ""
    model_name: str = "claude-sonnet-4-5"
    max_tokens: int = 2048
    temperature: float = 0.2

    # ChromaDB
    chroma_host: str = "chroma"
    chroma_port: int = 8000
    chroma_persist_dir: str = "./chroma_db"

    # RAG
    top_k_chunks: int = 5
    embedding_model: str = "text-embedding-3-small"

    # Session
    active_plug: str = "engineering_sme"
    session_ttl_seconds: int = 3600

    # Guardrails
    citation_pattern: str = r"\[Source:\s*.+?,\s*pg\s*\d+\]"
    pii_patterns: list[str] = [
        r"\b\d{3}-\d{2}-\d{4}\b",
        r"\b(?:\d{4}[- ]?){3}\d{4}\b",
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
    ]

    # Paths
    plugs_config_dir: str = "./data/plugs"
    docs_dir: str = "./docs"

    # Logging
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
>>>>>>> Stashed changes
