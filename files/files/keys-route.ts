// app/api/keys/create/route.ts
// Generates an SME-Plug API key, stores hash in Supabase, returns key ONCE.

import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!      // service role key — NEVER expose client-side
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name:      string
      plug_id:   string
      tenant_id: string
    }

    const { name, plug_id, tenant_id } = body

    if (!name || !plug_id || !tenant_id) {
      return NextResponse.json(
        { error: 'name, plug_id and tenant_id are required' },
        { status: 400 }
      )
    }

    // ── 1. Generate key ───────────────────────────────────────────────────────
    const rawBytes = randomBytes(32).toString('hex')      // 64 hex chars
    const fullKey  = `sme_live_${rawBytes}`               // sme_live_ + 64 chars
    const keyHash  = createHash('sha256').update(fullKey).digest('hex')
    const prefix   = `sme_live_${rawBytes.slice(0, 8)}...` // shown in UI forever

    // ── 2. Store ONLY hash + prefix in Supabase ───────────────────────────────
    const { error: insertError } = await supabase
      .from('api_keys')
      .insert({
        tenant_id,
        key_hash:   keyHash,
        key_prefix: prefix,
        plug_id,
        name,
        revoked:    false,
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create key', detail: insertError.message },
        { status: 500 }
      )
    }

    // ── 3. Return full key ONCE — never stored, never returned again ──────────
    return NextResponse.json({
      key:     fullKey,    // ← user copies this NOW — never shown again
      prefix,              // ← shown in the key table indefinitely
      plug_id,
      name,
    })

  } catch (err) {
    console.error('Key generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // List all keys for a tenant (shows prefix only, never hash/full key)
  const tenantId = req.nextUrl.searchParams.get('tenant_id')

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, plug_id, key_prefix, created_at, last_used, revoked')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ keys: data })
}
