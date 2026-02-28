"""Pydantic models for SME-Plug SDK responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Citation(BaseModel):
    """A source citation from the knowledge base."""

    source: str
    page: int
    relevance: float = 0.0


class ChatResponse(BaseModel):
    """Response from a chat query."""

    text: str = Field(alias="response")
    citations: list[Citation] = Field(default_factory=list)
    verified: bool = False
    ragas_score: float = Field(0.0, alias="ragas_score")
    session_id: str = ""

    model_config = {"populate_by_name": True}


class UploadResponse(BaseModel):
    """Response from a document upload."""

    document_id: str
    status: str  # "processing" | "ready" | "error"


class EvalResponse(BaseModel):
    """RAGAS evaluation scores."""

    faithfulness: float
    answer_relevancy: float
    context_precision: float
    overall: float


class SMEPlugError(Exception):
    """Custom error for SME-Plug API failures."""

    def __init__(self, message: str, code: str, status: int):
        super().__init__(message)
        self.code = code
        self.status = status

    def __repr__(self) -> str:
        return f"SMEPlugError(code={self.code!r}, status={self.status}, message={str(self)!r})"
