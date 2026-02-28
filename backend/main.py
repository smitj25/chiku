"""
main.py — FastAPI application entry point.
Mounts all routers, configures CORS, and handles startup/shutdown lifecycle.
"""

from __future__ import annotations

import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import chromadb
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.core.state_manager import StateManager
from backend.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    PlugInfo,
    PlugListResponse,
    SwitchPlugRequest,
    SwitchPlugResponse,
)

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App state (module-level singletons)
# ---------------------------------------------------------------------------
state_manager = StateManager()
plug_configs: dict[str, dict] = {}
chroma_client: chromadb.ClientAPI | None = None


def load_plug_configs() -> dict[str, dict]:
    """Read all JSON files from data/plugs/ into a dict keyed by plug_id."""
    configs = {}
    plugs_dir = Path(settings.plugs_config_dir)
    for f in plugs_dir.glob("*.json"):
        cfg = json.loads(f.read_text())
        configs[cfg["plug_id"]] = cfg
        logger.info(f"Loaded plug config: {cfg['plug_id']}")
    return configs


async def init_chroma() -> chromadb.ClientAPI:
    client = chromadb.HttpClient(host=settings.chroma_host, port=settings.chroma_port)
    # Ensure collections exist for each plug
    for plug_id, cfg in plug_configs.items():
        ns = cfg.get("chroma_namespace", plug_id)
        try:
            client.get_or_create_collection(f"{ns}_docs")
            logger.info(f"ChromaDB collection ready: {ns}_docs")
        except Exception as e:
            logger.warning(f"Could not ensure collection {ns}_docs: {e}")
    return client


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global plug_configs, chroma_client

    logger.info("=== SME-Plugin starting up ===")
    plug_configs = load_plug_configs()

    try:
        chroma_client = await init_chroma()
        logger.info("ChromaDB connected")
    except Exception as e:
        logger.warning(f"ChromaDB not reachable at startup (will retry per-request): {e}")
        chroma_client = None

    # Make singletons available on app.state for DI
    app.state.state_manager = state_manager
    app.state.plug_configs = plug_configs
    app.state.chroma_client = chroma_client

    logger.info("=== SME-Plugin ready ===")
    yield

    logger.info("=== SME-Plugin shutting down ===")
    state_manager.shutdown()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SME-Plugin API",
    description="Modular Subject-Matter Expert middleware with hot-swappable AI plugs",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

def get_state_manager() -> StateManager:
    return state_manager


def get_plug_config(plug_name: str) -> dict:
    if plug_name not in plug_configs:
        raise HTTPException(status_code=404, detail=f"Plug '{plug_name}' not found")
    return plug_configs[plug_name]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health():
    chroma_ok = chroma_client is not None
    try:
        if chroma_client:
            chroma_client.heartbeat()
    except Exception:
        chroma_ok = False

    return HealthResponse(
        status="ok",
        active_plug=settings.active_plug,
        chroma_connected=chroma_ok,
        session_count=state_manager.session_count(),
    )


@app.get("/api/plugs", response_model=PlugListResponse, tags=["plugs"])
async def list_plugs():
    plug_list = [
        PlugInfo(
            plug_id=cfg["plug_id"],
            domain=cfg.get("domain", ""),
            persona_summary=cfg.get("persona", "")[:120] + "…",
            tools=cfg.get("tools", []),
            chroma_namespace=cfg.get("chroma_namespace", cfg["plug_id"]),
        )
        for cfg in plug_configs.values()
    ]
    return PlugListResponse(plugs=plug_list, active_plug=settings.active_plug)


@app.post("/api/chat", response_model=ChatResponse, tags=["chat"])
async def chat(req: ChatRequest, sm: StateManager = Depends(get_state_manager)):
    from backend.core.context_engine import ContextEngine
    from backend.core.guardrails import Guardrails
    from backend.core.tool_injector import ToolInjector
    from backend.rag.retriever import Retriever

    plug_cfg = get_plug_config(req.plug_name)
    session = sm.get_or_create(req.session_id, req.plug_name)

    # 1. RAG — retrieve relevant chunks
    retriever = Retriever(chroma_client)
    chunks = await retriever.get_chunks(req.message, plug_cfg["chroma_namespace"])

    # 2. Build enriched system prompt
    ctx_engine = ContextEngine()
    tool_injector = ToolInjector()
    available_tools = tool_injector.get_tools_for_plug(plug_cfg)
    system_prompt = ctx_engine.build_system_prompt(session, plug_cfg, chunks, available_tools)

    # 3. LLM call with tool calling
    from backend.agents.base_agent import SMEAgent
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    agent = SMEAgent(plug_cfg, available_tools, client)

    try:
        raw_reply, handoff = await agent.run(req.message, session, system_prompt)
    except Exception as e:
        logger.error(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Handle cross-domain handoff
    if handoff:
        sm.switch_plug(req.session_id, handoff.target_plug)
        new_plug_cfg = get_plug_config(handoff.target_plug)
        new_tools = tool_injector.get_tools_for_plug(new_plug_cfg)
        new_chunks = await retriever.get_chunks(req.message, new_plug_cfg["chroma_namespace"])
        new_system = ctx_engine.build_system_prompt(session, new_plug_cfg, new_chunks, new_tools)
        new_agent = SMEAgent(new_plug_cfg, new_tools, client)
        context_msg = f"[Transferred from {handoff.source_plug}]: {handoff.transferred_context}\n{req.message}"
        raw_reply, _ = await new_agent.run(context_msg, session, new_system)
        plug_cfg = new_plug_cfg

    # 4. Guardrails
    guardrails = Guardrails(plug_cfg)
    safe_reply, triggered, reason = guardrails.validate(raw_reply)

    # 5. Parse citations from reply
    citations = guardrails.extract_citations(safe_reply, chunks)

    # 6. Persist to session history
    sm.add_message(req.session_id, "user", req.message)
    sm.add_message(req.session_id, "assistant", safe_reply)

    return ChatResponse(
        session_id=req.session_id,
        reply=safe_reply,
        citations=citations,
        active_plug=plug_cfg["plug_id"],
        guardrail_triggered=triggered,
        guardrail_reason=reason,
    )


@app.post("/api/switch-plug", response_model=SwitchPlugResponse, tags=["plugs"])
async def switch_plug(req: SwitchPlugRequest, sm: StateManager = Depends(get_state_manager)):
    if req.new_plug not in plug_configs:
        raise HTTPException(status_code=404, detail=f"Plug '{req.new_plug}' not found")

    session = sm.get_or_create(req.session_id, settings.active_plug)
    prev = session.active_plug
    sm.switch_plug(req.session_id, req.new_plug)

    return SwitchPlugResponse(
        session_id=req.session_id,
        active_plug=req.new_plug,
        previous_plug=prev,
        context_preserved=True,
    )
