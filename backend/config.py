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
