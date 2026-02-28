-- ════════════════════════════════════════════════════════════
-- SME-Plug — Supabase Schema
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- ── TENANTS ──────────────────────────────────────────────────────────────────
create table if not exists tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'starter',  -- starter | professional | enterprise
  created_at  timestamptz default now()
);

-- ── API KEYS ─────────────────────────────────────────────────────────────────
-- NEVER store the full key. Only hash + visible prefix.
create table if not exists api_keys (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete cascade,
  key_hash    text unique not null,   -- SHA-256 of full key
  key_prefix  text not null,          -- "sme_live_AbCd1234..." shown in UI
  plug_id     text not null,          -- "engineering" | "legal" | "healthcare"
  name        text not null,          -- user-provided label
  revoked     boolean not null default false,
  created_at  timestamptz default now(),
  last_used   timestamptz
);

-- ── PURCHASES ────────────────────────────────────────────────────────────────
create table if not exists purchases (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete cascade,
  plug_id     text not null,
  status      text not null default 'active',  -- active | cancelled
  created_at  timestamptz default now()
);

-- ── SESSIONS (conversation history) ──────────────────────────────────────────
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete cascade,
  plug_id     text not null,
  messages    jsonb not null default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── USAGE EVENTS ─────────────────────────────────────────────────────────────
create table if not exists usage_events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null,
  plug_id     text not null,
  timestamp   timestamptz default now()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
create index if not exists idx_api_keys_hash      on api_keys(key_hash);
create index if not exists idx_api_keys_tenant    on api_keys(tenant_id);
create index if not exists idx_usage_tenant_month on usage_events(tenant_id, timestamp);

-- ── RLS — disable for demo, enable for production ────────────────────────────
-- alter table api_keys  enable row level security;
-- alter table purchases enable row level security;
-- alter table sessions  enable row level security;

-- ── SEED DEMO DATA ────────────────────────────────────────────────────────────
-- Creates a demo tenant + demo API key you can use to test immediately
-- Demo key (unhashed): sme_live_demo_test_key_for_development_only_00000000

insert into tenants (id, name, plan)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo Tenant',
  'enterprise'
) on conflict (id) do nothing;

insert into api_keys (tenant_id, key_hash, key_prefix, plug_id, name)
values (
  '00000000-0000-0000-0000-000000000001',
  -- SHA-256 of 'sme_live_demo_test_key_for_development_only_00000000'
  'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
  'sme_live_demo...',
  'engineering',
  'Demo Key — Development Only'
) on conflict do nothing;

-- ════════════════════════════════════════════════════════════
-- After running this, your Supabase tables are ready.
-- The demo API key for testing is:
--   sme_live_demo_test_key_for_development_only_00000000
-- Use it in VS Code settings → smeplug.apiKey
-- ════════════════════════════════════════════════════════════
