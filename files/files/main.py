"""
main.py — SME-Plug Backend Brain
4 endpoints. That's all you need for the demo.
Run: uvicorn main:app --reload --port 8000
"""

import os, hashlib, secrets, re
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import anthropic
from dotenv import load_dotenv

load_dotenv()

# ── CLIENTS ───────────────────────────────────────────────────────────────────
app = FastAPI(title="SME-Plug API", version="1.0.0")
supabase: Client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])
claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

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

# ── SME PERSONAS ──────────────────────────────────────────────────────────────
# Injected when mode="sme". Absent when mode="baseline".
# THIS is what creates the hallucination vs cited response difference.

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

async def validate_key(api_key: str) -> Optional[dict]:
    if not api_key:
        return None
    try:
        key_hash = hash_key(api_key)
        result = supabase.table("api_keys")\
            .select("*")\
            .eq("key_hash", key_hash)\
            .is_("revoked_at", "null")\
            .single()\
            .execute()
        if result.data:
            supabase.table("api_keys")\
                .update({"last_used": datetime.utcnow().isoformat()})\
                .eq("key_hash", key_hash)\
                .execute()
            return result.data
    except Exception:
        pass
    return None

# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":    "ok",
        "version":   "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    x_api_key: str = Header(None, alias="x-api-key"),
):
    # 1. Validate key (dev test key bypasses Supabase)
    if x_api_key == os.environ.get("DEV_TEST_KEY", "dev-test-key-123"):
        tenant = {"id": "dev-tenant"}
    else:
        tenant = await validate_key(x_api_key)
        if not tenant:
            raise HTTPException(401, "Invalid or expired API key")

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
    else:
        # Baseline — plain LLM with no guidance. Will hallucinate.
        system = "You are a helpful assistant. Answer the user's question."

    # 4. Call Claude
    try:
        llm_response = claude.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": request.message}],
        )
        reply = llm_response.content[0].text
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

    # 6. Track usage
    try:
        supabase.table("usage_events").insert({
            "tenant_id": tenant.get("id", "unknown"),
            "plug_id":   request.plug_id,
            "mode":      request.mode,
            "timestamp": datetime.utcnow().isoformat(),
        }).execute()
    except Exception:
        pass

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

    try:
        supabase.table("api_keys").insert({
            "tenant_id":  request.tenant_id,
            "plugin_id":  request.plugin_id,
            "name":       request.name,
            "key_hash":   key_hash,
            "prefix":     prefix,
            "created_at": now,
        }).execute()
    except Exception as e:
        raise HTTPException(500, f"Failed to create key: {str(e)}")

    return KeyResponse(
        key=raw_key,
        prefix=prefix,
        name=request.name,
        plugin_id=request.plugin_id,
        created_at=now,
    )


@app.get("/keys/list/{tenant_id}")
async def list_keys(tenant_id: str):
    try:
        result = supabase.table("api_keys")\
            .select("id, name, plugin_id, prefix, created_at, last_used")\
            .eq("tenant_id", tenant_id)\
            .is_("revoked_at", "null")\
            .execute()
        return {"keys": result.data or []}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.delete("/keys/{key_id}")
async def revoke_key(key_id: str):
    try:
        supabase.table("api_keys")\
            .update({"revoked_at": datetime.utcnow().isoformat()})\
            .eq("id", key_id)\
            .execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/plugs")
async def list_plugs():
    return {"plugs": [
        {"id": "legal",       "name": "Legal SME",       "color": "#60a5fa", "domain": "Compliance & Contracts"},
        {"id": "healthcare",  "name": "Healthcare SME",  "color": "#34d399", "domain": "Clinical & Compliance"},
        {"id": "engineering", "name": "Engineering SME", "color": "#fbbf24", "domain": "Structural & Safety"},
    ]}
