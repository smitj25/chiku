"""
schemas.py — Single Source of Truth
SME-Plug MVP | All Pydantic models live here.
Every other file imports from this. Never define models elsewhere.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


# ─────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────

class PlanType(str, Enum):
    STARTER      = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE   = "enterprise"


class PlugDomain(str, Enum):
    LEGAL       = "legal"
    HEALTHCARE  = "healthcare"
    ENGINEERING = "engineering"


class GuardrailLayer(str, Enum):
    INPUT  = "input"
    OUTPUT = "output"


class JobStatus(str, Enum):
    PENDING    = "pending"
    RUNNING    = "running"
    COMPLETE   = "complete"
    FAILED     = "failed"


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:        EmailStr
    password:     str
    company_name: str


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    tenant_id:     str
    expires_in:    int = 3600


class RefreshRequest(BaseModel):
    refresh_token: str


class UserContext(BaseModel):
    user_id:   str
    tenant_id: str
    email:     str
    plan:      PlanType


# ─────────────────────────────────────────────
# TENANT
# ─────────────────────────────────────────────

class TenantConfig(BaseModel):
    tenant_id:    str
    company_name: str
    plan:         PlanType
    active_plugs: List[str]
    created_at:   datetime


class TenantCreateRequest(BaseModel):
    company_name: str
    plan:         PlanType = PlanType.STARTER
    active_plugs: List[str] = ["engineering"]


# ─────────────────────────────────────────────
# RAG + CITATIONS
# ─────────────────────────────────────────────

class Citation(BaseModel):
    source:           str
    page:             int
    chunk:            str
    similarity_score: float


class RetrieveRequest(BaseModel):
    query:     str
    namespace: str
    tenant_id: str
    top_k:     int = 5


class RetrieveResponse(BaseModel):
    citations: List[Citation]
    namespace: str


# ─────────────────────────────────────────────
# CHAT
# ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id:  str
    message:     str
    active_plug: str = "engineering"


class ChatResponse(BaseModel):
    response:         str
    citations:        List[Citation]
    active_plug:      str
    previous_plug:    Optional[str]  = None
    plug_switched:    bool           = False
    guardrail_fired:  bool           = False
    guardrail_reason: Optional[str]  = None
    faithfulness_score: Optional[float] = None
    session_id:       str            = ""
    timestamp:        datetime       = datetime.utcnow()


class Message(BaseModel):
    message_id: str
    session_id: str
    tenant_id:  str
    role:       str                  # "user" | "assistant"
    content:    str
    plug_id:    str
    citations:  List[Citation]       = []
    timestamp:  datetime             = datetime.utcnow()


class SessionHistory(BaseModel):
    session_id: str
    tenant_id:  str
    messages:   List[Message]
    created_at: datetime


class PlugSwitchRequest(BaseModel):
    session_id:  str
    target_plug: str


class PlugSwitchResponse(BaseModel):
    success:           bool
    previous_plug:     str
    active_plug:       str
    context_preserved: bool = True


# ─────────────────────────────────────────────
# SME PLUG CONFIG
# ─────────────────────────────────────────────

class SMEPlugConfig(BaseModel):
    id:               str
    display_name:     str
    color:            str
    persona:          str
    decision_tree:    List[str]
    keywords:         List[str]
    tools:            List[str]
    forbidden_topics: List[str]
    rag_namespace:    str
    citation_required: bool
    handoff_targets:  List[str] = []


class PlugListResponse(BaseModel):
    plugs:        List[SMEPlugConfig]
    active_plug:  str
    tenant_plugs: List[str]


# ─────────────────────────────────────────────
# GUARDRAILS
# ─────────────────────────────────────────────

class GuardrailResult(BaseModel):
    passed:            bool
    layer:             GuardrailLayer
    reason:            Optional[str]  = None
    sanitized_content: Optional[str]  = None
    pii_detected:      bool           = False
    injection_detected: bool          = False
    citation_missing:  bool           = False


# ─────────────────────────────────────────────
# BILLING
# ─────────────────────────────────────────────

class BillingPlan(BaseModel):
    tenant_id:        str
    plan:             PlanType
    plug_count:       int
    price_per_plug:   int      = 2000
    mrr:              int
    next_billing_date: datetime
    stripe_customer_id: Optional[str] = None
    stripe_sub_id:    Optional[str]   = None


class UsageStats(BaseModel):
    tenant_id:          str
    queries_this_month: int
    queries_limit:      int
    cost_accrued:       float
    plugs_used:         Dict[str, int]  # plug_id → query count


class Invoice(BaseModel):
    invoice_id: str
    month:      str
    amount:     float
    status:     str          # "paid" | "pending" | "failed"
    pdf_url:    Optional[str] = None
    created_at: datetime


class SubscribeRequest(BaseModel):
    plan:       PlanType
    plug_ids:   List[str]


class SubscribeResponse(BaseModel):
    success:            bool
    checkout_url:       Optional[str] = None  # Stripe checkout URL if real
    plan:               PlanType
    mrr:                int
    mock_mode:          bool = True


# ─────────────────────────────────────────────
# INTEGRATIONS — SALESFORCE
# ─────────────────────────────────────────────

class SalesforceAccount(BaseModel):
    account_id:      str
    name:            str
    industry:        str
    annual_revenue:  float
    employee_count:  int
    phone:           Optional[str] = None
    website:         Optional[str] = None


class SalesforceCase(BaseModel):
    case_id:      str
    subject:      str
    status:       str        # "Open" | "Closed" | "Escalated"
    priority:     str        # "High" | "Medium" | "Low"
    created_date: datetime
    account_name: str


class SalesforceResponse(BaseModel):
    account:    SalesforceAccount
    open_cases: List[SalesforceCase]
    mock_mode:  bool = True


# ─────────────────────────────────────────────
# INTEGRATIONS — SAP
# ─────────────────────────────────────────────

class SAPMaterial(BaseModel):
    material_id:  str
    description:  str
    stock_quantity: float
    unit:         str
    plant:        str
    valuation:    Optional[float] = None


class SAPPurchaseOrder(BaseModel):
    po_id:         str
    vendor_name:   str
    total_amount:  float
    status:        str        # "Open" | "Confirmed" | "Delivered"
    delivery_date: datetime
    line_items:    int


class SAPResponse(BaseModel):
    materials:       List[SAPMaterial]
    purchase_orders: List[SAPPurchaseOrder]
    mock_mode:       bool = True


# ─────────────────────────────────────────────
# FINE-TUNING
# ─────────────────────────────────────────────

class FinetuneRequest(BaseModel):
    plug_id:           str
    training_examples: int
    base_model:        str = "claude-sonnet-4-5"
    epochs:            int = 3


class FinetuneJob(BaseModel):
    job_id:       str
    tenant_id:    str
    plug_id:      str
    status:       JobStatus
    progress:     int         = 0    # 0–100
    model_id:     Optional[str] = None
    started_at:   datetime
    completed_at: Optional[datetime] = None
    mock_mode:    bool = True


class FinetuneStatusResponse(BaseModel):
    job_id:    str
    status:    JobStatus
    progress:  int
    model_id:  Optional[str] = None
    message:   str


# ─────────────────────────────────────────────
# EVALUATION — RAGAS
# ─────────────────────────────────────────────

class GoldenQAPair(BaseModel):
    question:       str
    ground_truth:   str
    plug_id:        str
    source_doc:     str


class RAGASScore(BaseModel):
    faithfulness:       float
    context_precision:  float
    context_recall:     float
    answer_correctness: float
    timestamp:          datetime
    plug_id:            Optional[str] = None


class EvalRunResponse(BaseModel):
    scores:          RAGASScore
    questions_tested: int
    passed:          bool        # faithfulness > 0.85
    baseline_comparison: Dict[str, float]  # metric → baseline score


# ─────────────────────────────────────────────
# SYSTEM
# ─────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:       str = "ok"
    version:      str = "1.0.0"
    chromadb:     bool
    llm:          bool
    auth:         bool
    timestamp:    datetime = datetime.utcnow()


class ErrorResponse(BaseModel):
    error:   str
    detail:  Optional[str] = None
    code:    int
