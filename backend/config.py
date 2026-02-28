"""SME-Plug Configuration."""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# -- Paths --
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CORPORA_DIR = DATA_DIR / "corpora"
INDICES_DIR = DATA_DIR / "indices"
NAMESPACES_FILE = DATA_DIR / "namespaces.json"

# Ensure directories exist
CORPORA_DIR.mkdir(parents=True, exist_ok=True)
INDICES_DIR.mkdir(parents=True, exist_ok=True)

# -- LLM Providers --
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Default LLM provider: "gemini" or "groq"
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# -- Guardrails --
MAX_HALLUCINATION_SCORE = float(os.getenv("MAX_HALLUCINATION_SCORE", "0.10"))
CITATION_CONFIDENCE_THRESHOLD = float(os.getenv("CITATION_CONFIDENCE_THRESHOLD", "0.85"))

# -- Server --
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
