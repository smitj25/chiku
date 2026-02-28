"""SME-Plug FastAPI Application Entry Point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import CORS_ORIGINS, HOST, PORT


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup."""
    from services.namespace_manager import namespace_manager
    namespace_manager.load()
    print("✅ SME-Plug services initialized")
    yield
    print("🛑 SME-Plug shutting down")


app = FastAPI(
    title="SME-Plug",
    description="Enterprise LLM Orchestration Harness — Deterministic, Auditable, Safe.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sme-plug", "version": "0.1.0"}


# -- Register routers (will be added in Phase 2) --
# from routers import query, personas, audit
# app.include_router(query.router)
# app.include_router(personas.router)
# app.include_router(audit.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
