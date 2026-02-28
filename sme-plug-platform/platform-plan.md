# SME-Plug — Full Product Platform Plan
# Developer SaaS Marketplace + IDE Plugin Ecosystem
# Next.js + Vercel | B2B Enterprise | Sequoia Demo

---

## WHAT WE'RE ACTUALLY BUILDING NOW

This is a two-part product:

PART 1 — THE PLATFORM (Next.js, deployed on Vercel)
  A developer marketplace where enterprises buy, configure,
  and manage SME-Plug plugins. Think: Stripe Dashboard + npm registry.

PART 2 — THE PLUGINS (distributed via IDE + npm/pip + REST API)
  The actual SME-Plug runtime that developers import into their
  codebase and configure via our platform.

The platform IS the business. The plugins are the product.

---

## COMPLETE NEXT.JS PROJECT STRUCTURE

```
sme-plug-platform/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Public pages — no auth needed
│   │   ├── page.tsx              # Landing page
│   │   ├── pricing/page.tsx      # Pricing tiers
│   │   └── docs/page.tsx         # Public documentation
│   │
│   ├── (auth)/                   # Auth pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/              # Protected — requires login
│   │   ├── layout.tsx            # Sidebar + topbar shell
│   │   ├── dashboard/page.tsx    # Overview + stats
│   │   ├── marketplace/page.tsx  # Browse + buy SME plugs
│   │   ├── plugins/
│   │   │   ├── page.tsx          # My purchased plugins
│   │   │   └── [plugId]/
│   │   │       ├── page.tsx      # Plugin detail
│   │   │       ├── configure/page.tsx  # Configurator
│   │   │       └── docs/page.tsx       # Plugin docs
│   │   ├── api-keys/page.tsx     # Generate + manage API keys
│   │   ├── billing/page.tsx      # Plans, invoices, usage
│   │   └── settings/page.tsx     # Account + org settings
│   │
│   └── api/                      # Next.js API routes
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   └── refresh/route.ts
│       ├── plugins/
│       │   ├── route.ts           # GET all marketplace plugins
│       │   └── [plugId]/route.ts  # GET single plugin detail
│       ├── keys/
│       │   ├── route.ts           # GET list / POST create API key
│       │   └── [keyId]/route.ts   # DELETE revoke key
│       ├── billing/
│       │   ├── checkout/route.ts  # POST create Stripe session
│       │   └── webhook/route.ts   # Stripe webhook handler
│       └── sme/
│           └── chat/route.ts      # Proxy to FastAPI backend
│
├── components/
│   ├── ui/                        # Base design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── PlugShowcase.tsx       # Live demo embed
│   │   ├── PricingTable.tsx
│   │   └── TrustBar.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── PlugCard.tsx
│   │   └── UsageMeter.tsx
│   ├── marketplace/
│   │   ├── PlugGrid.tsx
│   │   └── PlugDetailModal.tsx
│   ├── configurator/
│   │   ├── PersonaEditor.tsx      # Edit plug persona
│   │   ├── DocUploader.tsx        # Upload source docs
│   │   ├── RuleBuilder.tsx        # Set forbidden topics / guardrails
│   │   └── TestPlayground.tsx     # Test plug before deploying
│   └── apikeys/
│       ├── KeyTable.tsx
│       └── CreateKeyModal.tsx
│
├── lib/
│   ├── auth.ts                    # NextAuth or custom JWT logic
│   ├── stripe.ts                  # Stripe client
│   ├── db.ts                      # Prisma client (SQLite → Postgres)
│   └── sme-client.ts              # SDK wrapper around FastAPI
│
├── prisma/
│   └── schema.prisma              # DB schema
│
├── public/
│   ├── logo.svg
│   └── og-image.png
│
├── middleware.ts                   # Auth guard for /dashboard routes
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── vercel.json
```

---

## THE 8 PAGES — WHAT EACH DOES

### 1. LANDING PAGE  /
The homepage. Sells the product.
Sections:
  - Hero: headline + live demo embed (actual SME-Plug working)
  - Problem: hallucination stats, enterprise failures
  - How it works: 3 steps (Buy plug → Get API key → Import to IDE)
  - Plug showcase: Legal, Healthcare, Engineering cards with live preview
  - Pricing table: Starter / Pro / Enterprise
  - Trust bar: "Works with VS Code, Cursor, JetBrains, npm, pip"
  - CTA: "Get started free" → /register

### 2. AUTH  /login  /register
Clean enterprise login. Email + password.
Register creates: User + Tenant + seeds free tier.
Login returns: JWT stored in httpOnly cookie (not localStorage).
Redirect after login: /dashboard

### 3. DASHBOARD  /dashboard
Overview after login.
Shows:
  - Active plugins (count + names)
  - API calls this month (usage meter)
  - RAGAS faithfulness score across all plugs
  - Quick actions: "Buy new plug" / "Generate API key" / "Configure"
  - Recent activity feed

### 4. MARKETPLACE  /marketplace
Browse all available SME plugs to buy.
Each card shows:
  - Plug name + domain (Legal / Healthcare / Engineering)
  - Description + what it does
  - RAGAS score (social proof)
  - Price per month
  - "Buy Now" button → Stripe checkout
  - "Preview" button → live demo modal

### 5. MY PLUGINS  /plugins
List of purchased/active plugins.
Each plugin has 3 actions:
  - Configure → /plugins/[id]/configure
  - View Docs → /plugins/[id]/docs
  - Generate Key → /api-keys

### 6. PLUGIN CONFIGURATOR  /plugins/[id]/configure
The power feature. User customizes their plug.
Tabs:
  TAB 1 — PERSONA
    Rich text editor for the system persona
    Decision tree builder (add/remove/reorder steps)
    Preview: shows final system prompt

  TAB 2 — KNOWLEDGE BASE
    Upload source PDFs / docs
    File list with processing status
    "Re-index" button to refresh embeddings

  TAB 3 — GUARDRAILS
    Forbidden topics (add tags)
    PII redaction toggle
    Citation strictness slider (warn vs block)

  TAB 4 — TEST PLAYGROUND
    Chat interface to test the plug live
    Shows: retrieved chunks, active guardrails, citation badges
    "Deploy" button → saves config, updates API

### 7. API KEY MANAGEMENT  /api-keys
Generate and manage API keys per plugin.
Table shows:
  - Key name (e.g. "Production - Legal SME")
  - Plugin it's scoped to
  - Created date / last used
  - Permissions (read-only vs full)
  - Copy button (shown once on creation)
  - Revoke button

Key format: sme_live_xxxxxxxxxxxxxxxxxxxx
                   ↑ prefix identifies environment

### 8. BILLING  /billing
Current plan + usage + invoices.
Sections:
  - Current plan card (Starter/Pro/Enterprise)
  - Usage meter: API calls vs limit
  - Cost this month: $X / $Y limit
  - Per-plugin breakdown
  - Invoice history table
  - "Upgrade" → Stripe portal

---

## HOW THE API KEY SYSTEM WORKS

### Key Generation Flow
  1. User clicks "Generate API Key" in dashboard
  2. Selects which plugin to scope it to
  3. Names the key (e.g. "Production VS Code")
  4. System generates: sme_live_{32 random hex chars}
  5. Key shown ONCE — user copies it
  6. Hashed version stored in DB (never store plaintext)

### How User Uses the Key

VS Code / Cursor extension:
  settings.json:
  {
    "smeplug.apiKey": "sme_live_xxxx",
    "smeplug.pluginId": "legal-v1"
  }

npm package:
  import { SMEPlug } from '@smeplug/sdk'
  const plug = new SMEPlug({ apiKey: 'sme_live_xxxx' })
  const response = await plug.chat('What does clause 4.2 mean?')

pip package:
  from smeplug import SMEPlug
  plug = SMEPlug(api_key="sme_live_xxxx")
  response = plug.chat("What is the load factor for steel beams?")

REST API:
  POST https://api.smeplug.dev/v1/chat
  Headers: { Authorization: Bearer sme_live_xxxx }
  Body: { message: "...", session_id: "..." }

### Key Validation (backend middleware)
  1. Extract key from Authorization header
  2. Hash it with SHA-256
  3. Look up hash in DB → get tenant_id + plugin_id + permissions
  4. Inject tenant context into request
  5. If not found or revoked → 401 Unauthorized

---

## IDE PLUGIN ARCHITECTURE

### VS Code / Cursor Extension
  Package: smeplug-vscode
  Published to: VS Code Marketplace + Open VSX

  Features:
  - Sidebar panel: SME-Plug chat interface
  - Inline suggestions: right-click → "Ask SME-Plug"
  - Status bar: shows active plug + connection status
  - Settings: API key + plugin ID configuration
  - Docs panel: loads your uploaded docs inline

  How it works:
  - extension.ts calls our REST API with the API key
  - Response streamed back with SSE
  - Citations rendered as clickable links in sidebar

### npm Package
  Package: @smeplug/sdk
  Published to: npmjs.com

  import { SMEPlug } from '@smeplug/sdk'
  const plug = new SMEPlug({
    apiKey: process.env.SME_API_KEY,
    pluginId: 'legal-v1',
    stream: true
  })

### pip Package
  Package: smeplug
  Published to: PyPI

  from smeplug import SMEPlug
  plug = SMEPlug(api_key=os.environ["SME_API_KEY"])

### JetBrains Plugin
  Published to: JetBrains Marketplace
  Same REST API underneath, Kotlin/Java wrapper

---

## VERCEL DEPLOYMENT ARCHITECTURE

```
[User Browser]
     ↓
[Vercel Edge Network]
     ↓
[Next.js on Vercel]
  ├── Static pages (landing, pricing, docs) — CDN cached
  ├── /api/* routes — serverless functions
  └── /dashboard/* — SSR with auth check
     ↓
[FastAPI Backend — Railway or Render]
  ├── /sme/chat — LLM + RAG
  ├── /rag/* — ChromaDB queries
  └── /eval/* — RAGAS scoring
     ↓
[ChromaDB — persistent volume on Railway]
[SQLite → Postgres on Neon (free tier)]
```

### vercel.json
```json
{
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "ANTHROPIC_API_KEY": "@anthropic_key",
    "STRIPE_SECRET_KEY": "@stripe_secret",
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  },
  "rewrites": [
    {
      "source": "/api/sme/:path*",
      "destination": "https://your-fastapi.railway.app/:path*"
    }
  ]
}
```

---

## UPDATED 24HR SCHEDULE (SOLO)

Given the expanded scope, here's the revised priority order.
The platform IS the demo for Sequoia. The backend powers it.

HOUR 0–2:    schemas.py + config.py + Next.js project init ✓ (done)
HOUR 2–4:    Landing page (this is what Sequoia sees first)
HOUR 4–6:    Auth (login/register) + JWT + DB
HOUR 6–8:    FastAPI RAG core (vectorstore + retriever)
HOUR 8–10:   SME agent + context engine + guardrails
HOUR 10–12:  Dashboard + Marketplace pages
HOUR 12–14:  Plugin Configurator (the power feature)
HOUR 14–16:  API key generation + validation system
HOUR 16–18:  Billing page (mock Stripe)
HOUR 18–20:  VS Code extension scaffold + npm package stub
HOUR 20–22:  Connect all pages to FastAPI backend
HOUR 22–23:  Vercel deploy + domain config
HOUR 23–24:  Demo rehearsal + backup screenshots

---

## NEXT.JS PACKAGE.JSON

```json
{
  "name": "sme-plug-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "typescript": "5.5.4",
    "@types/node": "20.14.0",
    "@types/react": "18.3.3",
    "tailwindcss": "3.4.4",
    "autoprefixer": "10.4.19",
    "postcss": "8.4.38",
    "framer-motion": "11.3.0",
    "lucide-react": "0.400.0",
    "@prisma/client": "5.16.0",
    "prisma": "5.16.0",
    "stripe": "16.2.0",
    "jose": "5.6.3",
    "bcryptjs": "2.4.3",
    "@types/bcryptjs": "2.4.6",
    "zod": "3.23.8",
    "clsx": "2.1.1",
    "tailwind-merge": "2.4.0",
    "react-hook-form": "7.52.1",
    "@hookform/resolvers": "3.9.0",
    "sonner": "1.5.0",
    "recharts": "2.12.7",
    "shiki": "1.10.3",
    "@codemirror/lang-json": "6.0.1"
  }
}
```

---

## PRISMA SCHEMA

```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  createdAt    DateTime @default(now())
}

model Tenant {
  id          String   @id @default(cuid())
  companyName String
  plan        String   @default("starter")
  users       User[]
  apiKeys     ApiKey[]
  purchases   Purchase[]
  sessions    Session[]
  createdAt   DateTime @default(now())
}

model Plugin {
  id          String     @id @default(cuid())
  slug        String     @unique  // "legal-v1"
  name        String
  domain      String
  description String
  color       String
  price       Int        // cents per month
  ragasScore  Float
  purchases   Purchase[]
  configs     PluginConfig[]
}

model Purchase {
  id         String   @id @default(cuid())
  tenantId   String
  pluginId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  plugin     Plugin   @relation(fields: [pluginId], references: [id])
  stripeSubId String?
  status     String   @default("active")
  createdAt  DateTime @default(now())
}

model PluginConfig {
  id          String  @id @default(cuid())
  tenantId    String
  pluginId    String
  plugin      Plugin  @relation(fields: [pluginId], references: [id])
  persona     String
  decisionTree String  // JSON array stored as string
  guardrails  String   // JSON object stored as string
  updatedAt   DateTime @updatedAt
}

model ApiKey {
  id         String   @id @default(cuid())
  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
  pluginId   String
  name       String
  keyHash    String   @unique  // SHA-256 of actual key
  prefix     String            // "sme_live_xxxx" first 16 chars
  lastUsed   DateTime?
  createdAt  DateTime @default(now())
  revokedAt  DateTime?
}

model Session {
  id        String    @id @default(cuid())
  tenantId  String
  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  plugId    String
  messages  String    // JSON array of messages
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

---

## CLAUDE PROMPTS — WHAT TO SAY NEXT

### To build the landing page:
"Build app/(marketing)/page.tsx for SME-Plug — a B2B SaaS developer
platform that sells AI expert plugins. Next.js 14 App Router, Tailwind,
Framer Motion. Dark theme, industrial/technical aesthetic.

Sections in order:
1. Nav: logo left, 'Docs / Pricing / Login / Get Started' right
2. Hero: large headline 'The AI That Cites Its Sources', subheadline,
   two CTAs: 'Start for free' and 'View demo', floating code snippet
   showing: const plug = new SMEPlug({ apiKey: 'sme_live_xxx' })
3. Trust bar: 'Works with VS Code · Cursor · JetBrains · npm · pip · REST'
4. Problem section: 3 stats cards — '40% of enterprise AI projects cancelled',
   '20% of AI-generated code contains hallucinated packages',
   'Legal briefs filed with fabricated court citations'
5. How it works: 3 steps with icons — Buy plug, Get API key, Import to IDE
6. Plug cards: Legal (blue), Healthcare (green), Engineering (amber) —
   each shows RAGAS score and price
7. Pricing table: Starter $500/plug, Pro $1500/plug, Enterprise $2000/plug
8. Final CTA section: 'Ready to deploy trusted AI?' + 'Get started free'
9. Footer: logo, links, copyright"

### To build the configurator:
"Build app/(dashboard)/plugins/[plugId]/configure/page.tsx.
4-tab interface: Persona / Knowledge Base / Guardrails / Test Playground.
Persona tab: textarea for system prompt, decision tree step builder
(drag to reorder, add/delete steps), live preview of final prompt.
Knowledge Base: file upload area for PDFs, file list with status badges
(Processing / Ready / Error), re-index button.
Guardrails: tag input for forbidden topics, toggle switches for PII
redaction and injection detection, radio for citation mode (warn/block).
Test Playground: split view — left chat interface, right shows retrieved
chunks and active guardrail status. 'Deploy changes' button top right."

### To build API key management:
"Build app/(dashboard)/api-keys/page.tsx.
Table of existing keys: name, plugin, created, last used, prefix, actions.
'Create new key' button opens modal: name input, plugin selector dropdown,
environment toggle (live/test). On submit: shows generated key ONCE in
a highlighted box with copy button and warning 'Store this somewhere safe —
it will not be shown again'. Keys are prefixed sme_live_ or sme_test_."
