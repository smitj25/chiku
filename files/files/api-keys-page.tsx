'use client'
// app/(dashboard)/api-keys/page.tsx
// API Key management — generate, view, revoke

import { useState, useEffect, useCallback } from 'react'

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface ApiKey {
  id:         string
  name:       string
  plug_id:    string
  key_prefix: string
  created_at: string
  last_used:  string | null
  revoked:    boolean
}

const PLUG_COLORS: Record<string, string> = {
  engineering: '#fbbf24',
  legal:       '#60a5fa',
  healthcare:  '#34d399',
}

const PLUG_LABELS: Record<string, string> = {
  engineering: 'Engineering SME',
  legal:       'Legal SME',
  healthcare:  'Healthcare SME',
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  const [keys,          setKeys]          = useState<ApiKey[]>([])
  const [showModal,     setShowModal]     = useState(false)
  const [newKey,        setNewKey]        = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [copied,        setCopied]        = useState(false)

  // TODO: get real tenant_id from session/auth
  const TENANT_ID = 'demo-tenant-001'

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/keys/create?tenant_id=${TENANT_ID}`)
    const data = await res.json()
    setKeys(data.keys || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Revoke this key? Any app using it will stop working immediately.')) return
    await fetch(`/api/keys/${keyId}`, { method: 'DELETE' })
    fetchKeys()
  }

  const handleCopy = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{
      background: '#08080c', minHeight: '100vh',
      color: '#e5e7eb', fontFamily: "'Courier New', monospace",
      padding: '40px',
    }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
            SME-Plug Dashboard
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            API Keys
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6 }}>
            Generate scoped API keys for each SME plugin. Each key unlocks one plugin.<br />
            Copy your key immediately — it&apos;s shown once and never stored.
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setNewKey(null) }}
          style={{
            background: '#a3e635', color: '#0a0a0f',
            border: 'none', padding: '12px 24px',
            fontFamily: "'Courier New', monospace",
            fontSize: '13px', fontWeight: 700,
            letterSpacing: '0.06em', cursor: 'pointer',
          }}
        >
          + GENERATE KEY
        </button>
      </div>

      {/* USAGE CALLOUT */}
      <div style={{
        background: 'rgba(163,230,53,0.05)',
        border: '1px solid rgba(163,230,53,0.15)',
        padding: '16px 20px',
        marginBottom: '32px',
        fontSize: '12px', lineHeight: 1.7, color: '#a3e635',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', letterSpacing: '0.06em' }}>USING YOUR KEY IN VS CODE</div>
        <div style={{ color: 'rgba(163,230,53,0.7)' }}>
          1. Install the SME-Plug extension &nbsp;·&nbsp;
          2. Open Settings → SME-Plug → apiKey &nbsp;·&nbsp;
          3. Paste your key &nbsp;·&nbsp;
          4. Open the Demo Panel (Cmd+Shift+P → SME-Plug: Open Demo Panel)
        </div>
      </div>

      {/* KEYS TABLE */}
      {loading ? (
        <div style={{ color: '#4b5563', fontSize: '13px', padding: '40px 0' }}>Loading keys...</div>
      ) : keys.length === 0 ? (
        <div style={{
          border: '1px dashed rgba(255,255,255,0.08)',
          padding: '60px', textAlign: 'center',
          color: '#4b5563',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.4 }}>🔑</div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>No API keys yet</div>
          <div style={{ fontSize: '12px' }}>Generate a key to start using SME-Plug in your IDE</div>
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 160px 180px 140px 130px 100px',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: '10px', color: '#4b5563',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            <span>Name / Key</span>
            <span>Plugin</span>
            <span>Created</span>
            <span>Last Used</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {/* Rows */}
          {keys.map((key) => (
            <div key={key.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 160px 180px 140px 130px 100px',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'center',
              opacity: key.revoked ? 0.4 : 1,
            }}>
              <div>
                <div style={{ fontSize: '13px', color: '#f0f0f0', marginBottom: '4px' }}>{key.name}</div>
                <div style={{ fontSize: '11px', color: '#4b5563', letterSpacing: '0.05em' }}>{key.key_prefix}</div>
              </div>

              <div>
                <span style={{
                  background: `${PLUG_COLORS[key.plug_id]}18`,
                  border: `1px solid ${PLUG_COLORS[key.plug_id]}40`,
                  color: PLUG_COLORS[key.plug_id],
                  padding: '3px 10px', fontSize: '11px',
                  borderRadius: '2px',
                }}>
                  {PLUG_LABELS[key.plug_id] || key.plug_id}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {new Date(key.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </div>

              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {key.last_used
                  ? new Date(key.last_used).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Never'}
              </div>

              <div>
                <span style={{
                  fontSize: '10px', letterSpacing: '0.08em', fontWeight: 700,
                  padding: '3px 10px',
                  background: key.revoked ? 'rgba(239,68,68,0.1)' : 'rgba(163,230,53,0.08)',
                  border: `1px solid ${key.revoked ? 'rgba(239,68,68,0.3)' : 'rgba(163,230,53,0.25)'}`,
                  color: key.revoked ? '#ef4444' : '#a3e635',
                }}>
                  {key.revoked ? 'REVOKED' : '● ACTIVE'}
                </span>
              </div>

              <div>
                {!key.revoked && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '11px', padding: '5px 12px',
                      cursor: 'pointer', letterSpacing: '0.05em',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    REVOKE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GENERATE KEY MODAL */}
      {showModal && (
        <GenerateKeyModal
          tenantId={TENANT_ID}
          onClose={() => { setShowModal(false); setNewKey(null); fetchKeys() }}
          onKeyGenerated={(key) => setNewKey(key)}
          newKey={newKey}
          copied={copied}
          onCopy={handleCopy}
        />
      )}
    </div>
  )
}

// ── GENERATE KEY MODAL ────────────────────────────────────────────────────────
function GenerateKeyModal({
  tenantId, onClose, onKeyGenerated, newKey, copied, onCopy,
}: {
  tenantId:         string
  onClose:          () => void
  onKeyGenerated:   (key: string) => void
  newKey:           string | null
  copied:           boolean
  onCopy:           () => void
}) {
  const [name,     setName]     = useState('')
  const [plugId,   setPlugId]   = useState('engineering')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleGenerate = async () => {
    if (!name.trim()) { setError('Key name is required'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/keys/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), plug_id: plugId, tenant_id: tenantId }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error || 'Failed to generate key'); setLoading(false); return }
    onKeyGenerated(data.key)
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#111118', border: '1px solid rgba(255,255,255,0.1)',
        padding: '36px', width: '520px', maxWidth: '90vw',
        fontFamily: "'Courier New', monospace",
      }}>
        <div style={{ fontSize: '20px', fontFamily: 'Georgia, serif', color: '#f5f5f5', marginBottom: '6px', fontWeight: 700 }}>
          {newKey ? '🔑 Copy Your Key' : 'Generate API Key'}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '28px' }}>
          {newKey
            ? 'This key is shown ONCE. Store it somewhere safe — you cannot retrieve it again.'
            : 'Scoped to one plugin. Name it by environment or use case.'}
        </div>

        {!newKey ? (
          <>
            {/* NAME INPUT */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Key Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. Production — VS Code, Dev Testing"
                autoFocus
                style={{
                  width: '100%', background: '#0a0a0f',
                  border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  color: '#e5e7eb', padding: '10px 14px',
                  fontFamily: "'Courier New', monospace", fontSize: '13px',
                  outline: 'none',
                }}
              />
              {error && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>{error}</div>}
            </div>

            {/* PLUGIN SELECTOR */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Plugin
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {(['engineering', 'legal', 'healthcare'] as const).map(id => (
                  <button
                    key={id}
                    onClick={() => setPlugId(id)}
                    style={{
                      flex: 1, padding: '10px',
                      background: plugId === id ? `${PLUG_COLORS[id]}15` : 'transparent',
                      border: `1px solid ${plugId === id ? PLUG_COLORS[id] : 'rgba(255,255,255,0.1)'}`,
                      color: plugId === id ? PLUG_COLORS[id] : '#6b7280',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '11px', cursor: 'pointer',
                      letterSpacing: '0.05em', transition: 'all 0.2s',
                      textTransform: 'uppercase',
                    }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleGenerate}
                disabled={loading}
                style={{
                  flex: 1, background: '#a3e635', color: '#0a0a0f',
                  border: 'none', padding: '12px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '13px', fontWeight: 700,
                  letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'GENERATING...' : 'GENERATE KEY →'}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#6b7280',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '13px', padding: '12px 20px',
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
            </div>
          </>
        ) : (
          /* SHOW KEY ONCE */
          <>
            <div style={{
              background: '#0a0a0f',
              border: '1px solid rgba(163,230,53,0.3)',
              padding: '16px',
              fontFamily: "'Courier New', monospace",
              fontSize: '13px',
              color: '#a3e635',
              letterSpacing: '0.04em',
              wordBreak: 'break-all',
              marginBottom: '14px',
              lineHeight: 1.6,
            }}>
              {newKey}
            </div>

            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#ef4444',
              marginBottom: '20px',
              lineHeight: 1.6,
            }}>
              ⚠ This key will NOT be shown again. Copy it now and store it in a password manager or your VS Code settings.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onCopy}
                style={{
                  flex: 1,
                  background: copied ? 'rgba(163,230,53,0.15)' : '#a3e635',
                  color: copied ? '#a3e635' : '#0a0a0f',
                  border: copied ? '1px solid rgba(163,230,53,0.4)' : 'none',
                  padding: '12px',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '13px', fontWeight: 700,
                  letterSpacing: '0.06em', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ COPIED!' : 'COPY KEY'}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '13px', padding: '12px 24px',
                  cursor: 'pointer',
                }}
              >
                DONE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
