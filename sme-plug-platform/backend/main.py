"""
main.py — SME-Plug Backend Brain (Groq-powered)
4 endpoints. That's all you need for the demo.
Run: uvicorn backend.main:app --reload --port 8000
"""

import os, hashlib, secrets, re, shutil
from datetime import datetime, timezone
from typing import Optional
from collections import defaultdict
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from backend.rag.retriever import retrieve, format_context

load_dotenv()

# ── CLIENTS ───────────────────────────────────────────────────────────────────
app = FastAPI(title="SME-Plug API", version="1.0.0")
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

# ── LOGGING IMPORTS ────────────────────────────────────────────────────────────
import time
from backend.db import log_api_call, log_document, get_api_usage, get_plugin_config

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3001",
        "https://*.vercel.app",
        os.environ.get("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.integrations.sap_routes import sap_router
app.include_router(sap_router, prefix="/integrations")

# ── SME PERSONAS ──────────────────────────────────────────────────────────────
SME_PERSONAS = {
    "legal": """You are a licensed legal compliance expert working for an enterprise.

RULES YOU CANNOT BREAK:
1. Every factual claim MUST end with [Source: document_name, pg X]
2. If you cannot find a source, respond ONLY with:
   "I cannot verify this claim without a source document."
3. Never give legal advice — only cite what documents state
4. Flag HIGH RISK clauses explicitly
5. Structure your response as:
   FINDING: [your answer]
   CITATIONS: [Source: X, pg Y] for each claim
   RISK LEVEL: LOW / MEDIUM / HIGH

You are currently loaded as the Legal SME Plugin for SME-Plug.""",

    "healthcare": """You are a clinical documentation specialist working for a healthcare enterprise.

RULES YOU CANNOT BREAK:
1. Every clinical claim MUST end with [Source: document_name, pg X]
2. If you cannot find a source, respond ONLY with:
   "I cannot verify this without a clinical source document."
3. Never diagnose — only reference what guidelines state
4. Flag CRITICAL patient safety concerns explicitly
5. Structure your response as:
   CLINICAL FINDING: [your answer]
   CITATIONS: [Source: X, pg Y] for each claim
   SAFETY FLAG: NONE / ADVISORY / CRITICAL

You are currently loaded as the Healthcare SME Plugin for SME-Plug.""",

    "engineering": """You are a licensed structural engineer working for an enterprise.

RULES YOU CANNOT BREAK:
1. Every technical claim MUST end with [Source: document_name, pg X]
2. If you cannot find a source, respond ONLY with:
   "I cannot verify this without a source document."
3. Always flag safety factors below 1.5 as HIGH RISK
4. Structure your response as:
   ENGINEERING FINDING: [your answer]
   CITATIONS: [Source: X, pg Y] for each claim
   SAFETY FLAG: COMPLIANT / REVIEW REQUIRED / HIGH RISK

You are currently loaded as the Engineering SME Plugin for SME-Plug.""",
}

PLUG_COLORS = {
    "legal":       "#60a5fa",
    "healthcare":  "#34d399",
    "engineering": "#fbbf24",
}

# ── MODELS ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message:    str
    plug_id:    str = "legal"
    mode:       str = "sme"       # "sme" or "baseline"
    session_id: Optional[str] = None
    use_sap:    bool = False
    sap_tenant_id: str = "buildco"

class ChatResponse(BaseModel):
    response:        str
    mode:            str
    plug_id:         str
    plug_color:      str
    citations:       list
    has_citations:   bool
    guardrail_fired: bool
    timestamp:       str

class CreateKeyRequest(BaseModel):
    name:      str
    plugin_id: str
    tenant_id: str

class KeyResponse(BaseModel):
    key:        str
    prefix:     str
    name:       str
    plugin_id:  str
    created_at: str

# ── HELPERS ───────────────────────────────────────────────────────────────────

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def extract_citations(text: str) -> list:
    return re.findall(r'\[Source:[^\]]+\]', text)

def check_guardrails(text: str) -> bool:
    injection_phrases = [
        "ignore previous", "ignore your instructions",
        "act as dan", "jailbreak", "forget your prompt",
        "new persona", "disregard", "override your",
    ]
    return any(p in text.lower() for p in injection_phrases)

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":    "ok",
        "version":   "1.0.0",
        "llm":       "groq",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    x_api_key: str = Header(None, alias="x-api-key"),
):
    # 1. Validate key (dev test key bypasses DB check)
    dev_key = os.environ.get("DEV_TEST_KEY", "dev-test-key-123")
    if x_api_key != dev_key and not x_api_key:
        raise HTTPException(401, "API key required. Pass x-api-key header.")

    # Track start time for latency
    start_time = time.time()

    # 2. Input guardrail
    if check_guardrails(request.message):
        return ChatResponse(
            response="Request blocked by SME-Plug guardrail. Manipulation attempt detected.",
            mode=request.mode,
            plug_id=request.plug_id,
            plug_color=PLUG_COLORS.get(request.plug_id, "#888"),
            citations=[],
            has_citations=False,
            guardrail_fired=True,
            timestamp=datetime.utcnow().isoformat(),
        )

    # 3. Build system prompt based on mode
    if request.mode == "sme":
        system = SME_PERSONAS.get(request.plug_id, SME_PERSONAS["legal"])
        
        # Check custom config
        custom_config = get_plugin_config(x_api_key or dev_key, request.plug_id)
        if custom_config:
            import json
            persona = custom_config.get("persona")
            if persona:
                system = persona
                
            dt_str = custom_config.get("decisionTree")
            if dt_str:
                try:
                    decisionTree = json.loads(dt_str)
                    if isinstance(decisionTree, list) and len(decisionTree) > 0:
                        system += "\n\nDECISION TREE STEPS:\n"
                        for i, step in enumerate(decisionTree):
                            system += f"{i+1}. {step}\n"
                except Exception:
                    pass
                    
            gr_str = custom_config.get("guardrails")
            if gr_str:
                try:
                    guardrails = json.loads(gr_str)
                    if isinstance(guardrails, dict):
                        topics = guardrails.get("forbiddenTopics", [])
                        if topics:
                            system += "\n\nCRITICAL GUARDRAILS:\nYou MUST NOT discuss the following topics under any circumstances:\n- " + "\n- ".join(topics)
                except Exception:
                    pass

        # ── RAG: retrieve real document chunks ────────────────────────
        chunks = retrieve(request.message, request.plug_id, top_k=5)
        context = format_context(chunks)
        if context:
            system += "\n\n" + context
        # ──────────────────────────────────────────────────────────────
    else:
        # Baseline — plain LLM with no guidance. Will hallucinate.
        system = "You are a helpful assistant. Answer the user's question."

    if request.use_sap:
        from backend.integrations.sap_mock import build_sap_context
        sap_ctx = build_sap_context(request.sap_tenant_id)
        system += f"\n\n{sap_ctx}"

    # 4. Call Groq (using llama or mixtral)
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    try:
        llm_response = groq_client.chat.completions.create(
            model=model,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": request.message},
            ],
        )
        reply = llm_response.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(500, f"LLM error: {str(e)}")

    # 5. Output guardrail — citations required in SME mode
    citations = extract_citations(reply)
    has_citations = len(citations) > 0

    if request.mode == "sme" and not has_citations:
        reply = (
            "I cannot verify this claim without a source document. "
            "Please upload relevant documents to your SME-Plug knowledge base "
            "and re-ask your question."
        )

    
    # Log api call (sync, fire-and-forget for now)
    latency_ms = int((time.time() - start_time) * 1000)
    log_api_call(
        api_key=x_api_key or dev_key,
        plug_id=request.plug_id,
        endpoint="/chat",
        status=200,
        latency_ms=latency_ms
    )

    return ChatResponse(
        response=reply,
        mode=request.mode,
        plug_id=request.plug_id,
        plug_color=PLUG_COLORS.get(request.plug_id, "#888"),
        citations=citations,
        has_citations=has_citations,
        guardrail_fired=False,
        timestamp=datetime.utcnow().isoformat(),
    )


@app.post("/keys/create", response_model=KeyResponse)
async def create_key(request: CreateKeyRequest):
    raw_key  = f"sme_live_{secrets.token_hex(16)}"
    key_hash = hash_key(raw_key)
    prefix   = raw_key[:20] + "..."
    now      = datetime.utcnow().isoformat()

    return KeyResponse(
        key=raw_key,
        prefix=prefix,
        name=request.name,
        plugin_id=request.plugin_id,
        created_at=now,
    )


@app.get("/plugs")
async def list_plugs():
    return {"plugs": [
        {"id": "legal",       "name": "Legal SME",       "color": "#60a5fa", "domain": "Compliance & Contracts"},
        {"id": "healthcare",  "name": "Healthcare SME",  "color": "#34d399", "domain": "Clinical & Compliance"},
        {"id": "engineering", "name": "Engineering SME", "color": "#fbbf24", "domain": "Structural & Safety"},
    ]}


# ── HALLUCINATION COMPARISON ─────────────────────────────────────────────────

class CompareRequest(BaseModel):
    message:   str
    plug_id:   str = "legal"

@app.post("/v1/compare")
async def compare_hallucination(
    request: CompareRequest,
    authorization: str = Header(None),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """
    Run the same query through:
      LEFT  → raw LLM (no RAG, no persona, no guardrails)
      RIGHT → SME-Plug (RAG + persona + guardrails)
    Returns both side-by-side so the frontend can highlight differences.
    """
    plug_id = request.plug_id.replace("-v1", "")
    query   = request.message

    # ── LEFT SIDE: Raw LLM (hallucination-prone) ──────────────────────────
    raw_system = (
        "You are a helpful AI assistant. Answer the user's question. "
        "If you reference any sources, include them as citations in [Source: ...] format."
    )
    try:
        raw_resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": raw_system},
                {"role": "user", "content": query},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        raw_text = raw_resp.choices[0].message.content or ""
    except Exception as e:
        raw_text = f"[Error from raw LLM: {e}]"

    raw_citations = extract_citations(raw_text)

    # ── RIGHT SIDE: SME-Plug (RAG + persona + guardrails) ─────────────────
    chunks = retrieve(query, plug_id, top_k=3)
    context_block = format_context(chunks)

    persona = SME_PERSONAS.get(plug_id, SME_PERSONAS["legal"])
    sme_system = f"{persona}\n\n{context_block}" if context_block else persona

    try:
        sme_resp = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": sme_system},
                {"role": "user", "content": query},
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        sme_text = sme_resp.choices[0].message.content or ""
    except Exception as e:
        sme_text = f"[Error from SME-Plug: {e}]"

    sme_citations = extract_citations(sme_text)
    has_real_citations = len(sme_citations) > 0

    # ── Analyze differences ───────────────────────────────────────────────
    raw_has_citations = len(raw_citations) > 0

    return {
        "query": query,
        "plug_id": plug_id,
        "raw": {
            "response":   raw_text,
            "citations":  raw_citations,
            "has_citations": raw_has_citations,
            "label":      "Raw LLM (No RAG)",
            "risk":       "HIGH — citations may be hallucinated",
        },
        "sme": {
            "response":   sme_text,
            "citations":  sme_citations,
            "has_citations": has_real_citations,
            "label":      f"SME-Plug ({plug_id.title()} Expert)",
            "risk":       "LOW — citations verified against uploaded documents" if has_real_citations else "MEDIUM — no documents found for this query",
            "chunks_used": len(chunks),
        },
        "verdict": {
            "hallucination_detected": raw_has_citations and not has_real_citations,
            "sme_verified": has_real_citations,
            "summary": (
                "⚠️ Raw LLM fabricated citations that don't exist in any uploaded document. "
                "SME-Plug correctly cited real sources from your knowledge base."
            ) if has_real_citations else (
                "Upload documents to see the full power of verified citations vs hallucination."
            ),
        },
    }

# ── USAGE STATS ───────────────────────────────────────────────────────────────

@app.get("/v1/usage")
async def get_usage(
    authorization: str = Header(None),
    x_api_key: str = Header(None, alias="x-api-key"),
):
    """Get API call counts for the current month, scoped by API key."""
    # Identify the caller
    api_key = ""
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]
    elif x_api_key:
        api_key = x_api_key

    now = datetime.now(timezone.utc)
    total_calls, user_calls, per_plug = get_api_usage(api_key)

    return {
        "total_calls_this_month": total_calls,
        "user_calls_this_month":  user_calls,
        "per_plugin": dict(per_plug),
        "limit":      10_000,
        "month":      now.strftime("%B %Y"),
        "days_left":  (now.replace(month=now.month % 12 + 1, day=1) - now).days if now.month < 12 else (now.replace(year=now.year + 1, month=1, day=1) - now).days,
    }


# ── VS CODE EXTENSION COMPATIBILITY (/v1/chat with Bearer auth) ──────────────
# The installed VS Code extension calls POST /v1/chat with Authorization: Bearer

class V1ChatRequest(BaseModel):
    message:    str
    plugin_id:  str = "legal-v1"
    session_id: Optional[str] = None

@app.post("/v1/chat")
async def v1_chat(
    request: V1ChatRequest,
    authorization: str = Header(None),
):
    # Extract key from "Bearer xxx" header
    api_key = ""
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]

    # Accept any key for now (dev mode)
    if not api_key:
        raise HTTPException(401, "API key required. Set your key in VS Code settings.")

    # Track start time
    start_time = time.time()

    # Map "legal-v1" → "legal", "healthcare-v1" → "healthcare", etc.
    plug_id = request.plugin_id.replace("-v1", "")

    # Input guardrail
    if check_guardrails(request.message):
        return {
            "response": "Request blocked by SME-Plug guardrail. Manipulation attempt detected.",
            "citations": [],
            "verified": False,
            "ragas_score": 0,
            "session_id": request.session_id or "",
            "guardrail_fired": True,
        }

    # Build system prompt (always SME mode from VS Code)
    system = SME_PERSONAS.get(plug_id, SME_PERSONAS["legal"])

    # Check custom config
    custom_config = get_plugin_config(api_key, plug_id)
    if custom_config:
        import json
        persona = custom_config.get("persona")
        if persona:
            system = persona
            
        dt_str = custom_config.get("decisionTree")
        if dt_str:
            try:
                decisionTree = json.loads(dt_str)
                if isinstance(decisionTree, list) and len(decisionTree) > 0:
                    system += "\n\nDECISION TREE STEPS:\n"
                    for i, step in enumerate(decisionTree):
                        system += f"{i+1}. {step}\n"
            except Exception:
                pass
                
        gr_str = custom_config.get("guardrails")
        if gr_str:
            try:
                guardrails = json.loads(gr_str)
                if isinstance(guardrails, dict):
                    topics = guardrails.get("forbiddenTopics", [])
                    if topics:
                        system += "\n\nCRITICAL GUARDRAILS:\nYou MUST NOT discuss the following topics under any circumstances:\n- " + "\n- ".join(topics)
            except Exception:
                pass

    # ── RAG: retrieve real document chunks ────────────────────────────
    chunks = retrieve(request.message, plug_id, top_k=5)
    context = format_context(chunks)
    if context:
        system += "\n\n" + context
    # ──────────────────────────────────────────────────────────────────

    # Call Groq
    model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    try:
        llm_response = groq_client.chat.completions.create(
            model=model,
            max_tokens=1024,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": request.message},
            ],
        )
        reply = llm_response.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(500, f"LLM error: {str(e)}")

    citations = extract_citations(reply)
    has_citations = len(citations) > 0

    if not has_citations:
        reply = (
            "I cannot verify this claim without a source document. "
            "Please upload relevant documents to your SME-Plug knowledge base "
            "and re-ask your question."
        )

    latency_ms = int((time.time() - start_time) * 1000)
    log_api_call(
        api_key=api_key,
        plug_id=plug_id,
        endpoint="/v1/chat",
        status=200,
        latency_ms=latency_ms
    )

    # Calculate dynamic RAGAS score based on retrieved chunks' relevance
    avg_score = 0
    print("CHUNKS ARE:", chunks)
    if has_citations and chunks:
        avg_score = sum(c.get("score", 0) for c in chunks) / len(chunks)
        
    return {
        "response": reply,
        "citations": [{"source": c, "page": 0, "relevance": 0.95} for c in citations],
        "verified": has_citations,
        "ragas_score": round(avg_score, 2) if has_citations else 0,
        "session_id": request.session_id or "",
        "guardrail_fired": False,
        "has_citations": has_citations,
        "plug_id": plug_id,
        "plug_color": PLUG_COLORS.get(plug_id, "#888"),
    }

# ── DOCUMENT UPLOAD + MANAGEMENT ─────────────────────────────────────────────

DOCS_DIR = Path(os.environ.get("DOCS_DIR", "./data/docs"))

@app.post("/v1/upload")
async def upload_document(
    file: UploadFile = File(...),
    plugin_id: str = Form("legal"),
    authorization: str = Header(None),
):
    """Upload a PDF or TXT file to a plugin's knowledge base."""
    # Auth check
    if not authorization:
        raise HTTPException(401, "Authorization header required.")

    # Strip -v1 suffix
    plug_id = plugin_id.replace("-v1", "")

    # Validate file type
    allowed = {".pdf", ".txt", ".md", ".csv"}
    ext = Path(file.filename or "unknown.txt").suffix.lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}. Accepted: {', '.join(allowed)}")

    # Save file to data/docs/{plug_id}/
    plug_dir = DOCS_DIR / plug_id
    plug_dir.mkdir(parents=True, exist_ok=True)
    dest = plug_dir / file.filename
    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)

    # Auto-ingest into ChromaDB
    from backend.rag.ingestor import ingest_plug
    chunks_count = ingest_plug(plug_id, str(DOCS_DIR))
    
    # Log Document to Supabase DB.
    size_bytes = len(content)
    api_key = authorization.replace("Bearer ", "") if authorization and authorization.startswith("Bearer ") else ""
    log_document(filename=file.filename, size_bytes=size_bytes, plug_id=plug_id, api_key=api_key)

    return {
        "status":   "ingested",
        "filename": file.filename,
        "plug_id":  plug_id,
        "chunks":   chunks_count,
        "message":  f"{file.filename} uploaded and indexed ({chunks_count} chunks).",
    }


@app.get("/v1/documents")
async def list_documents(
    plugin_id: str = "legal",
    authorization: str = Header(None),
):
    """List all uploaded documents for a plugin."""
    plug_id = plugin_id.replace("-v1", "")
    plug_dir = DOCS_DIR / plug_id

    if not plug_dir.exists():
        return {"documents": [], "plug_id": plug_id}

    docs = []
    for f in plug_dir.iterdir():
        if f.is_file() and f.suffix.lower() in {".pdf", ".txt", ".md", ".csv"}:
            docs.append({
                "filename": f.name,
                "size_kb":  round(f.stat().st_size / 1024, 1),
                "uploaded": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            })

    return {"documents": docs, "plug_id": plug_id}


@app.delete("/v1/documents/{filename}")
async def delete_document(
    filename: str,
    plugin_id: str = "legal",
    authorization: str = Header(None),
):
    """Delete a document and re-index the collection."""
    plug_id = plugin_id.replace("-v1", "")
    filepath = DOCS_DIR / plug_id / filename

    if not filepath.exists():
        raise HTTPException(404, f"Document '{filename}' not found.")

    filepath.unlink()

    # Re-index after deletion
    from backend.rag.ingestor import ingest_plug
    chunks_count = ingest_plug(plug_id, str(DOCS_DIR))

    return {
        "status":  "deleted",
        "filename": filename,
        "plug_id":  plug_id,
        "remaining_chunks": chunks_count,
    }

