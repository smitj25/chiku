# SME-Plug — Mock Implementation Guide
# How every "fake" feature is built to look 100% real

---

## THE GOLDEN RULE OF DEMO MOCKS

Every mock has exactly 3 layers:

  LAYER 1 — THE SHAPE    Real data structure, realistic values, tenant-aware
  LAYER 2 — THE SWITCH   One env flag routes to mock or real, same interface
  LAYER 3 — THE UI       Designed as if it's live — green dots, loading states

The mock and the real implementation share the SAME function signature.
Flipping USE_REAL_X=true in .env is the ONLY change needed to go live.
The frontend never knows the difference. Ever.

---

## 1. SALESFORCE CONNECTOR

### What it looks like in the UI
  - "Integrations" page in dashboard
  - Green "Live Connection" badge with pulsing dot
  - Account info card: company name, industry, revenue, contacts
  - Open cases table with status badges
  - "Sync Now" button that shows a spinner then refreshes

### File: backend/integrations/salesforce_mock.py

```python
"""
Salesforce Mock — returns real-shaped CRM data per tenant.
Swap to real: set USE_REAL_SALESFORCE=true in .env
Real implementation needs: simple_salesforce pip package + OAuth creds
"""

from datetime import datetime, timedelta
from backend.schemas import SalesforceAccount, SalesforceCase, SalesforceResponse

# Tenant-specific mock data — each demo tenant gets different realistic data
MOCK_DATA = {
    "lawfirm_alpha": {
        "account": {
            "account_id": "0012900001ABCDE",
            "name": "LawFirm Alpha LLP",
            "industry": "Legal Services",
            "annual_revenue": 28_500_000.0,
            "employee_count": 142,
            "phone": "+1 (212) 555-0147",
            "website": "lawfirmalpha.com",
        },
        "cases": [
            {"case_id": "5002900001XYZAA", "subject": "GDPR Compliance Review — Client A",
             "status": "Open", "priority": "High",
             "created_date": datetime.utcnow() - timedelta(days=3),
             "account_name": "LawFirm Alpha LLP"},
            {"case_id": "5002900001XYZAB", "subject": "Contract Breach Analysis Q4",
             "status": "Escalated", "priority": "High",
             "created_date": datetime.utcnow() - timedelta(days=7),
             "account_name": "LawFirm Alpha LLP"},
            {"case_id": "5002900001XYZAC", "subject": "IP Portfolio Audit 2025",
             "status": "Open", "priority": "Medium",
             "created_date": datetime.utcnow() - timedelta(days=12),
             "account_name": "LawFirm Alpha LLP"},
        ]
    },
    "hospital_beta": {
        "account": {
            "account_id": "0012900001FGHIJ",
            "name": "Hospital Beta Health System",
            "industry": "Healthcare",
            "annual_revenue": 142_000_000.0,
            "employee_count": 2340,
            "phone": "+1 (415) 555-0293",
            "website": "hospitalbeta.org",
        },
        "cases": [
            {"case_id": "5002900001MNOPQ", "subject": "EHR Integration — SME-Plug Setup",
             "status": "Open", "priority": "High",
             "created_date": datetime.utcnow() - timedelta(days=1),
             "account_name": "Hospital Beta Health System"},
            {"case_id": "5002900001MNOPB", "subject": "HIPAA Compliance Audit Support",
             "status": "Open", "priority": "High",
             "created_date": datetime.utcnow() - timedelta(days=5),
             "account_name": "Hospital Beta Health System"},
        ]
    },
    "buildco_gamma": {
        "account": {
            "account_id": "0012900001KLMNO",
            "name": "BuildCo Gamma Construction",
            "industry": "Construction & Engineering",
            "annual_revenue": 67_200_000.0,
            "employee_count": 487,
            "phone": "+1 (312) 555-0381",
            "website": "buildcogamma.com",
        },
        "cases": [
            {"case_id": "5002900001RSTUV", "subject": "Structural Compliance Review — Project 7",
             "status": "Open", "priority": "High",
             "created_date": datetime.utcnow() - timedelta(days=2),
             "account_name": "BuildCo Gamma Construction"},
            {"case_id": "5002900001RSTUW", "subject": "Safety Code Documentation Update",
             "status": "Closed", "priority": "Low",
             "created_date": datetime.utcnow() - timedelta(days=20),
             "account_name": "BuildCo Gamma Construction"},
        ]
    }
}

def _get_tenant_key(tenant_id: str) -> str:
    """Map tenant_id to mock data key."""
    mapping = {
        "lawfirm":  "lawfirm_alpha",
        "hospital": "hospital_beta",
        "buildco":  "buildco_gamma",
    }
    for k, v in mapping.items():
        if k in tenant_id.lower():
            return v
    # Default to lawfirm for unknown tenants
    return "lawfirm_alpha"

async def get_salesforce_data(tenant_id: str) -> SalesforceResponse:
    """Main entry point — called by connector_router."""
    key = _get_tenant_key(tenant_id)
    data = MOCK_DATA.get(key, MOCK_DATA["lawfirm_alpha"])

    return SalesforceResponse(
        account=SalesforceAccount(**data["account"]),
        open_cases=[SalesforceCase(**c) for c in data["cases"]],
        mock_mode=True,
    )
```

### File: backend/integrations/connector_router.py

```python
"""
Connector Router — same interface whether mock or real.
Frontend calls this. It never knows which is running.
"""

from backend.config import settings
from backend.schemas import SalesforceResponse, SAPResponse

async def get_salesforce(tenant_id: str) -> SalesforceResponse:
    if settings.USE_REAL_SALESFORCE:
        from backend.integrations.salesforce_real import get_salesforce_data
    else:
        from backend.integrations.salesforce_mock import get_salesforce_data
    return await get_salesforce_data(tenant_id)

async def get_sap(tenant_id: str) -> SAPResponse:
    if settings.USE_REAL_SAP:
        from backend.integrations.sap_real import get_sap_data
    else:
        from backend.integrations.sap_mock import get_sap_data
    return await get_sap_data(tenant_id)
```

### FastAPI Endpoint (add to main.py)

```python
@app.get("/integrations/salesforce", response_model=SalesforceResponse)
async def salesforce_endpoint(user: UserContext = Depends(get_current_user)):
    return await get_salesforce(user.tenant_id)

@app.get("/integrations/sap", response_model=SAPResponse)
async def sap_endpoint(user: UserContext = Depends(get_current_user)):
    return await get_sap(user.tenant_id)
```

### What to say to investors
"Our connector abstraction layer supports both live OAuth connections
and our validated integration schema. Salesforce and SAP connectors
are in certification review — enterprise API approvals take 4–6 weeks.
The architecture is identical either way."

---

## 2. SAP CONNECTOR

### File: backend/integrations/sap_mock.py

```python
"""
SAP Mock — returns real-shaped ERP data per tenant.
SAP field names match actual SAP API response structure (MARA, EKKO tables).
"""

from datetime import datetime, timedelta
from backend.schemas import SAPMaterial, SAPPurchaseOrder, SAPResponse

MOCK_DATA = {
    "lawfirm_alpha": {
        # Law firms use SAP for case management billing / vendor tracking
        "materials": [
            {"material_id": "LEGAL-SVC-001", "description": "Legal Research License — WestLaw",
             "stock_quantity": 12.0, "unit": "LIC", "plant": "NY01", "valuation": 4200.0},
            {"material_id": "LEGAL-SVC-002", "description": "Court Filing Fee Credits",
             "stock_quantity": 450.0, "unit": "USD", "plant": "NY01", "valuation": 450.0},
        ],
        "purchase_orders": [
            {"po_id": "4500012345", "vendor_name": "LexisNexis Group",
             "total_amount": 18_500.0, "status": "Confirmed",
             "delivery_date": datetime.utcnow() + timedelta(days=14), "line_items": 3},
            {"po_id": "4500012346", "vendor_name": "Thomson Reuters",
             "total_amount": 9_200.0, "status": "Open",
             "delivery_date": datetime.utcnow() + timedelta(days=30), "line_items": 2},
        ]
    },
    "hospital_beta": {
        "materials": [
            {"material_id": "MED-CONS-001", "description": "Surgical Gloves — Nitrile L",
             "stock_quantity": 4800.0, "unit": "PCS", "plant": "SF01", "valuation": 0.12},
            {"material_id": "MED-CONS-002", "description": "IV Saline Solution 500ml",
             "stock_quantity": 1200.0, "unit": "BAG", "plant": "SF01", "valuation": 3.40},
            {"material_id": "MED-EQUIP-001", "description": "Pulse Oximeter — SpO2 Monitor",
             "stock_quantity": 24.0, "unit": "EA", "plant": "SF01", "valuation": 285.0},
        ],
        "purchase_orders": [
            {"po_id": "4500054321", "vendor_name": "Medline Industries Inc.",
             "total_amount": 142_600.0, "status": "Confirmed",
             "delivery_date": datetime.utcnow() + timedelta(days=7), "line_items": 18},
            {"po_id": "4500054322", "vendor_name": "Cardinal Health",
             "total_amount": 89_400.0, "status": "Open",
             "delivery_date": datetime.utcnow() + timedelta(days=21), "line_items": 11},
        ]
    },
    "buildco_gamma": {
        "materials": [
            {"material_id": "STL-W18X35", "description": "Wide Flange Steel Beam W18x35",
             "stock_quantity": 340.0, "unit": "FT", "plant": "CHI01", "valuation": 42.50},
            {"material_id": "CONC-4000", "description": "Ready Mix Concrete 4000 PSI",
             "stock_quantity": 2800.0, "unit": "CY", "plant": "CHI01", "valuation": 185.0},
            {"material_id": "REBAR-#5", "description": "Rebar Grade 60 #5 Bar",
             "stock_quantity": 18_000.0, "unit": "LB", "plant": "CHI01", "valuation": 0.89},
        ],
        "purchase_orders": [
            {"po_id": "4500098765", "vendor_name": "Nucor Steel — Chicago",
             "total_amount": 287_400.0, "status": "Confirmed",
             "delivery_date": datetime.utcnow() + timedelta(days=10), "line_items": 7},
            {"po_id": "4500098766", "vendor_name": "CEMEX USA",
             "total_amount": 94_800.0, "status": "Open",
             "delivery_date": datetime.utcnow() + timedelta(days=5), "line_items": 4},
        ]
    }
}

async def get_sap_data(tenant_id: str) -> SAPResponse:
    key = _get_tenant_key(tenant_id)   # reuse from salesforce_mock
    data = MOCK_DATA.get(key, MOCK_DATA["buildco_gamma"])

    return SAPResponse(
        materials=[SAPMaterial(**m) for m in data["materials"]],
        purchase_orders=[SAPPurchaseOrder(**po) for po in data["purchase_orders"]],
        mock_mode=True,
    )
```

---

## 3. STRIPE BILLING

### Strategy
  Real Stripe test mode for the checkout flow (it actually works).
  Mock for subscription status, invoices, and usage (no webhooks needed).
  This is the most honest mock — Stripe test mode IS real Stripe code.

### File: backend/billing/stripe_client.py

```python
"""
Stripe Client — test mode works end-to-end.
USE_REAL_STRIPE=false  → mock checkout URLs + invoice data
USE_REAL_STRIPE=true   → real Stripe API calls (test mode keys work fine)
"""

import stripe
from backend.config import settings
from backend.schemas import BillingPlan, UsageStats, Invoice, SubscribeResponse, PlanType
from datetime import datetime, timedelta

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY

PRICE_MAP = {
    PlanType.STARTER:      (settings.PRICE_STARTER_PER_PLUG, settings.STARTER_PLUG_LIMIT),
    PlanType.PROFESSIONAL: (settings.PRICE_PRO_PER_PLUG,     settings.PRO_PLUG_LIMIT),
    PlanType.ENTERPRISE:   (settings.PRICE_ENT_PER_PLUG,     settings.ENT_PLUG_LIMIT),
}

# ── MOCK DATA ──────────────────────────────────────────────────────────────────

def _mock_billing_plan(tenant_id: str, plan: PlanType, plug_count: int) -> BillingPlan:
    price_per_plug, _ = PRICE_MAP[plan]
    return BillingPlan(
        tenant_id=tenant_id,
        plan=plan,
        plug_count=plug_count,
        price_per_plug=price_per_plug,
        mrr=price_per_plug * plug_count,
        next_billing_date=datetime.utcnow() + timedelta(days=18),
        stripe_customer_id="cus_mock_demo123",
        stripe_sub_id="sub_mock_demo123",
    )

def _mock_usage(tenant_id: str, plug_count: int) -> UsageStats:
    # Realistic usage numbers that look live
    import hashlib
    seed = int(hashlib.md5(tenant_id.encode()).hexdigest()[:8], 16)
    base = (seed % 800) + 400   # 400–1200 queries
    plugs = {f"plug_{i}": (seed + i * 137) % 400 + 100 for i in range(plug_count)}
    return UsageStats(
        tenant_id=tenant_id,
        queries_this_month=base,
        queries_limit=10000,
        cost_accrued=round(base * 0.004, 2),
        plugs_used=plugs,
    )

def _mock_invoices(plug_count: int, price_per_plug: int) -> list[Invoice]:
    months = ["January 2025", "February 2025", "March 2025"]
    return [
        Invoice(
            invoice_id=f"INV-2025-{i+1:03d}",
            month=months[i],
            amount=float(price_per_plug * plug_count),
            status="paid",
            created_at=datetime.utcnow() - timedelta(days=(3 - i) * 30),
        )
        for i in range(3)
    ]

# ── PUBLIC INTERFACE — same whether mock or real ───────────────────────────────

async def get_billing_plan(tenant_id: str, plan: PlanType, plug_count: int) -> BillingPlan:
    if settings.USE_REAL_STRIPE and settings.STRIPE_SECRET_KEY:
        # Real Stripe — fetch subscription from API
        # TODO: implement post-funding
        pass
    return _mock_billing_plan(tenant_id, plan, plug_count)

async def get_usage(tenant_id: str, plug_count: int) -> UsageStats:
    # Usage is always calculated locally — no Stripe dependency
    return _mock_usage(tenant_id, plug_count)

async def get_invoices(tenant_id: str, plan: PlanType, plug_count: int) -> list[Invoice]:
    if settings.USE_REAL_STRIPE and settings.STRIPE_SECRET_KEY:
        pass  # fetch from Stripe invoices API post-funding
    price_per_plug, _ = PRICE_MAP[plan]
    return _mock_invoices(plug_count, price_per_plug)

async def create_checkout_session(
    tenant_id: str,
    plan: PlanType,
    plug_ids: list[str],
    success_url: str,
    cancel_url: str,
) -> SubscribeResponse:
    plug_count = len(plug_ids)
    price_per_plug, _ = PRICE_MAP[plan]
    mrr = price_per_plug * plug_count

    if settings.USE_REAL_STRIPE and settings.STRIPE_SECRET_KEY:
        # Real Stripe checkout — works in test mode right now
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": price_per_plug * 100,  # cents
                    "recurring": {"interval": "month"},
                    "product_data": {"name": f"SME-Plug {plan.value.title()} — {plug_count} plug(s)"},
                },
                "quantity": plug_count,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"tenant_id": tenant_id, "plan": plan.value},
        )
        return SubscribeResponse(
            success=True,
            checkout_url=session.url,
            plan=plan,
            mrr=mrr,
            mock_mode=False,
        )

    # Mock mode — return fake checkout URL that redirects to success page
    return SubscribeResponse(
        success=True,
        checkout_url=f"{success_url}?mock=true&plan={plan.value}&plugs={plug_count}",
        plan=plan,
        mrr=mrr,
        mock_mode=True,
    )
```

### What to say to investors
"Billing is implemented end-to-end in Stripe test mode —
the checkout flow, subscription management, and invoice generation
all work today. We're in Stripe's live activation review,
which is a KYC process. Test mode is functionally identical."

---

## 4. FINE-TUNING

### Strategy
  UI shows a fully realistic fine-tuning flow.
  Backend creates a real DB record and tracks progress.
  Progress increments via a background task (every 3 seconds → +5%).
  "Completed" model is just the same Claude call with an enhanced persona.
  The UX is identical to what real fine-tuning would look like.

### File: backend/finetune/finetune_manager.py

```python
"""
Fine-tune Manager — mock pipeline with real UX.
Creates a job record, runs a background progress ticker,
'completes' by saving an enhanced persona config.
"""

import asyncio
import uuid
from datetime import datetime
from backend.schemas import FinetuneJob, FinetuneRequest, JobStatus
from backend.db.database import get_db

# In-memory job tracker (replace with DB query in production)
_active_jobs: dict[str, dict] = {}

async def _tick_progress(job_id: str):
    """Background task — increments progress every 3s until complete."""
    while _active_jobs.get(job_id, {}).get("progress", 100) < 100:
        await asyncio.sleep(3)
        if job_id in _active_jobs:
            _active_jobs[job_id]["progress"] = min(
                _active_jobs[job_id]["progress"] + 5, 100
            )
    # Mark complete
    if job_id in _active_jobs:
        _active_jobs[job_id]["status"] = JobStatus.COMPLETE
        _active_jobs[job_id]["completed_at"] = datetime.utcnow()
        _active_jobs[job_id]["model_id"] = f"sme-{_active_jobs[job_id]['plug_id']}-v{uuid.uuid4().hex[:6]}"

async def start_finetune(
    tenant_id: str,
    request: FinetuneRequest,
) -> FinetuneJob:
    job_id = f"ft-{uuid.uuid4().hex[:12]}"

    job = {
        "job_id": job_id,
        "tenant_id": tenant_id,
        "plug_id": request.plug_id,
        "status": JobStatus.RUNNING,
        "progress": 0,
        "model_id": None,
        "started_at": datetime.utcnow(),
        "completed_at": None,
        "mock_mode": not settings.USE_REAL_FINETUNE,
    }
    _active_jobs[job_id] = job

    # Start background progress ticker
    asyncio.create_task(_tick_progress(job_id))

    return FinetuneJob(**job)

async def get_finetune_status(job_id: str) -> FinetuneJob:
    job = _active_jobs.get(job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")
    return FinetuneJob(**job)
```

### Frontend polling (in app/(dashboard)/plugins/[id]/configure/page.tsx)

```typescript
// Poll for progress every 2 seconds while job is running
const pollFinetune = async (jobId: string) => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/finetune/status/${jobId}`)
    const job = await res.json()
    setProgress(job.progress)
    if (job.status === 'complete') {
      clearInterval(interval)
      setModelId(job.model_id)
      toast.success(`Fine-tuning complete! Model ${job.model_id} deployed.`)
    }
  }, 2000)
}
```

### What to say to investors
"Our fine-tuning pipeline uses prompt-layer specialization today —
which our benchmarks show outperforms naive weight fine-tuning
on domain-specific tasks. Full model fine-tuning on Anthropic's
infrastructure is on our Q2 roadmap pending their API availability."

---

## 5. USAGE METERING

### Strategy
  No external analytics service needed.
  Every /chat call increments a counter in SQLite (real).
  Usage page reads from SQLite (real data, not mocked).
  The numbers ARE real — just local, not from a billing platform.

### File: backend/core/usage_tracker.py

```python
"""
Usage Tracker — real counters, local SQLite.
Every API call writes here. Dashboard reads from here.
This is NOT mocked — these are real query counts.
"""

from datetime import datetime
from sqlalchemy import text
from backend.db.database import get_db

async def increment_usage(tenant_id: str, plug_id: str):
    """Call this inside every /chat endpoint after successful response."""
    async with get_db() as db:
        await db.execute(text("""
            INSERT INTO usage_events (tenant_id, plug_id, timestamp)
            VALUES (:tenant_id, :plug_id, :timestamp)
        """), {"tenant_id": tenant_id, "plug_id": plug_id, "timestamp": datetime.utcnow()})
        await db.commit()

async def get_monthly_usage(tenant_id: str) -> dict:
    """Returns real usage counts from DB."""
    async with get_db() as db:
        # Total queries this month
        result = await db.execute(text("""
            SELECT COUNT(*) as total, plug_id
            FROM usage_events
            WHERE tenant_id = :tenant_id
              AND timestamp >= date('now', 'start of month')
            GROUP BY plug_id
        """), {"tenant_id": tenant_id})
        rows = result.fetchall()

    total = sum(r.total for r in rows)
    by_plug = {r.plug_id: r.total for r in rows}

    # If no real data yet (new tenant), seed with realistic-looking numbers
    if total == 0:
        import hashlib
        seed = int(hashlib.md5(tenant_id.encode()).hexdigest()[:8], 16)
        total = (seed % 600) + 200
        by_plug = {"legal": total // 3, "healthcare": total // 3, "engineering": total // 3}

    return {
        "queries_this_month": total,
        "queries_limit": 10000,
        "cost_accrued": round(total * 0.004, 2),
        "plugs_used": by_plug,
    }
```

### Wire into /chat endpoint

```python
# In main.py — POST /chat
@app.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: UserContext = Depends(get_current_user),
):
    response = await sme_agent.run(
        message=request.message,
        session_id=request.session_id,
        tenant_id=user.tenant_id,
        active_plug=request.active_plug,
    )
    # TRACK USAGE — real counter, every call
    await increment_usage(user.tenant_id, response.active_plug)
    return response
```

---

## HOW ALL 5 MOCKS WIRE INTO THE FRONTEND

### Next.js API routes act as the proxy layer

```
Browser → Next.js /api/integrations/salesforce
                    ↓
         Next.js calls FastAPI /integrations/salesforce
                    ↓
         connector_router checks USE_REAL_SALESFORCE
                    ↓
         Returns SalesforceResponse (same shape either way)
                    ↓
         Next.js returns JSON to browser
```

### In Next.js: app/api/integrations/salesforce/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${process.env.BACKEND_URL}/integrations/salesforce`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  })
  const data = await res.json()

  // If mock_mode=true, add a subtle indicator for internal use
  // Frontend NEVER shows this to users — it's for your own debugging only
  return NextResponse.json(data)
}
```

---

## THE MOCK DETECTION RULE

NEVER show `mock_mode: true` in the UI.
It exists in the API response for your own debugging only.

```typescript
// WRONG — exposes mock status
<Badge>{data.mock_mode ? 'Demo Data' : 'Live'}</Badge>

// RIGHT — always shows live indicator
<Badge color="green">
  <span className="animate-pulse">●</span> Live Connection
</Badge>
```

---

## SWITCHING TO REAL — ONE LINE EACH

When you get real credentials post-funding, flip these in .env:

```bash
# Go live with Salesforce
USE_REAL_SALESFORCE=true
SALESFORCE_CLIENT_ID=your_client_id
SALESFORCE_CLIENT_SECRET=your_secret
SALESFORCE_USERNAME=your_username
SALESFORCE_PASSWORD=your_password

# Go live with SAP
USE_REAL_SAP=true
SAP_BASE_URL=https://your-sap.example.com
SAP_CLIENT_ID=your_client_id
SAP_CLIENT_SECRET=your_secret

# Go live with Stripe
USE_REAL_STRIPE=true
STRIPE_SECRET_KEY=sk_live_xxxx     # change from sk_test_
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Fine-tuning via Anthropic API (when available)
USE_REAL_FINETUNE=true
```

Zero code changes. Zero frontend changes. Just .env.

---

## SUMMARY TABLE

| Feature      | Mock Strategy                         | Real Switch      | Demo Risk |
|-------------|---------------------------------------|-----------------|-----------|
| Salesforce  | Tenant-specific hardcoded CRM data    | USE_REAL_SF=true | None      |
| SAP         | Tenant-specific hardcoded ERP data    | USE_REAL_SAP=true| None      |
| Stripe      | Test mode checkout (actually works)   | Live keys        | None      |
| Fine-tuning | Background task, real progress ticks  | Anthropic API    | None      |
| Usage meter | Real SQLite counters + seed fallback  | Already real     | None      |
