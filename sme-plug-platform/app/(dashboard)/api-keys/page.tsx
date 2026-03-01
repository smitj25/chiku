"use client";
// app/(dashboard)/api-keys/page.tsx
// Real API Key management — generate, view, revoke via Prisma

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Copy, Trash2, Check, Key } from "lucide-react";

interface ApiKey {
    id: string;
    name: string;
    pluginId: string;
    prefix: string;
    createdAt: string;
    lastUsed: string | null;
    revokedAt: string | null;
}

const PLUG_COLORS: Record<string, string> = {
    engineering: "#fbbf24",
    legal: "#60a5fa",
    healthcare: "#34d399",
};

const PLUG_LABELS: Record<string, string> = {
    engineering: "Engineering SME",
    legal: "Legal SME",
    healthcare: "Healthcare SME",
};

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const fetchKeys = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/keys");
            const data = await res.json();
            setKeys(data.keys || []);
        } catch (err) {
            console.error("Failed to fetch keys:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const handleRevoke = async (keyId: string) => {
        if (!confirm("Revoke this key? Any app using it will stop working immediately.")) return;
        await fetch(`/api/keys/${keyId}`, { method: "DELETE" });
        fetchKeys();
    };

    const handleCopy = () => {
        if (newKey) {
            navigator.clipboard.writeText(newKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-8">
            {/* HEADER */}
            <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="ui-page-title text-3xl mb-2">API Keys</h1>
                    <p className="ui-page-subtitle">
                        Generate scoped API keys for each SME plugin. Each key unlocks one plugin.<br />
                        Copy your key immediately — it&apos;s shown once and never stored.
                    </p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setNewKey(null); }}
                    className="flex items-center gap-2 bg-lime text-canvas font-mono font-bold text-xs tracking-[0.06em] px-5 py-2.5 hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                    <Plus size={14} /> GENERATE KEY
                </button>
            </div>

            {/* USAGE CALLOUT */}
            <div className="bg-[rgba(163,230,53,0.04)] border border-[rgba(163,230,53,0.15)] p-4 rounded-md">
                <div className="font-mono text-xs font-bold text-lime tracking-[0.06em] mb-1">USING YOUR KEY IN VS CODE</div>
                <div className="font-mono text-[11px] text-[rgba(163,230,53,0.6)] leading-relaxed">
                    1. Install the SME-Plug extension &nbsp;·&nbsp;
                    2. Open Settings → SME-Plug → apiKey &nbsp;·&nbsp;
                    3. Paste your key &nbsp;·&nbsp;
                    4. Open the Demo Panel (Cmd+Shift+P → SME-Plug: Compare)
                </div>
            </div>

            {/* KEYS TABLE */}
            {loading ? (
                <div className="text-text-ghost font-mono text-sm py-10">Loading keys...</div>
            ) : keys.length === 0 ? (
                <div className="border border-dashed border-border p-16 text-center rounded-lg">
                    <Key size={32} className="mx-auto mb-4 text-text-ghost opacity-40" />
                    <div className="font-mono text-sm text-text-ghost mb-2">No API keys yet</div>
                    <div className="font-mono text-xs text-text-ghost">Generate a key to start using SME-Plug in your IDE</div>
                </div>
            ) : (
                <div className="section-card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                {["Name / Key", "Plugin", "Created", "Last Used", "Status", ""].map(h => (
                                    <th key={h} className="text-left font-mono text-[10px] text-text-ghost tracking-[0.1em] px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map((key, i) => (
                                <motion.tr
                                    key={key.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors ${key.revokedAt ? "opacity-40" : ""}`}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-mono text-xs text-text-primary">{key.name}</div>
                                        <div className="font-mono text-[11px] text-text-ghost tracking-[0.05em]">{key.prefix}</div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <span
                                            className="font-mono text-[11px] px-2 py-0.5 rounded-[3px] border"
                                            style={{
                                                background: `${PLUG_COLORS[key.pluginId] || "#888"}18`,
                                                borderColor: `${PLUG_COLORS[key.pluginId] || "#888"}40`,
                                                color: PLUG_COLORS[key.pluginId] || "#888",
                                            }}
                                        >
                                            {PLUG_LABELS[key.pluginId] || key.pluginId}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 font-mono text-[11px] text-text-ghost">
                                        {new Date(key.createdAt).toLocaleDateString("en-US", {
                                            month: "short", day: "numeric", year: "numeric"
                                        })}
                                    </td>

                                    <td className="px-4 py-3 font-mono text-[11px] text-text-ghost">
                                        {key.lastUsed
                                            ? new Date(key.lastUsed).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                            : "Never"}
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-[3px] border ${key.revokedAt
                                                ? "bg-[rgba(239,68,68,0.08)] text-red-stat border-[rgba(239,68,68,0.25)]"
                                                : "bg-[rgba(163,230,53,0.06)] text-lime border-[rgba(163,230,53,0.25)]"
                                            }`}>
                                            {key.revokedAt ? "REVOKED" : "● ACTIVE"}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3">
                                        {!key.revokedAt && (
                                            <button
                                                onClick={() => handleRevoke(key.id)}
                                                className="text-text-ghost hover:text-red-stat cursor-pointer bg-transparent border-none transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* GENERATE KEY MODAL */}
            {showModal && (
                <GenerateKeyModal
                    onClose={() => { setShowModal(false); setNewKey(null); fetchKeys(); }}
                    onKeyGenerated={(key) => setNewKey(key)}
                    newKey={newKey}
                    copied={copied}
                    onCopy={handleCopy}
                />
            )}
        </div>
    );
}

// ── GENERATE KEY MODAL ────────────────────────────────────────────────────────
function GenerateKeyModal({
    onClose, onKeyGenerated, newKey, copied, onCopy,
}: {
    onClose: () => void;
    onKeyGenerated: (key: string) => void;
    newKey: string | null;
    copied: boolean;
    onCopy: () => void;
}) {
    const [name, setName] = useState("");
    const [pluginId, setPluginId] = useState("engineering");
    const [genLoading, setGenLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        if (!name.trim()) { setError("Key name is required"); return; }
        setGenLoading(true); setError("");

        try {
            const res = await fetch("/api/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), pluginId }),
            });
            const data = await res.json();

            if (!res.ok) { setError(data.error || "Failed to generate key"); setGenLoading(false); return; }
            onKeyGenerated(data.key);
        } catch {
            setError("Network error");
        }
        setGenLoading(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-canvas border border-border rounded-lg w-full max-w-md p-6"
            >
                <h2 className="font-display text-xl font-bold text-text-primary mb-1">
                    {newKey ? "🔑 Copy Your Key" : "Generate API Key"}
                </h2>
                <p className="font-mono text-[11px] text-text-ghost mb-6">
                    {newKey
                        ? "This key is shown ONCE. Store it somewhere safe — you cannot retrieve it again."
                        : "Scoped to one plugin. Name it by environment or use case."}
                </p>

                {!newKey ? (
                    <>
                        {/* NAME INPUT */}
                        <div className="mb-4">
                            <label className="block font-mono text-[10px] text-text-faint tracking-[0.1em] mb-2">KEY NAME</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleGenerate()}
                                placeholder="e.g. Production — VS Code, Dev Testing"
                                autoFocus
                                className={`w-full bg-surface border rounded-md px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-ghost outline-none focus:border-lime ${error ? "border-red-stat" : "border-border"}`}
                            />
                            {error && <div className="font-mono text-[11px] text-red-stat mt-1">{error}</div>}
                        </div>

                        {/* PLUGIN SELECTOR */}
                        <div className="mb-7">
                            <label className="block font-mono text-[10px] text-text-faint tracking-[0.1em] mb-2">PLUGIN</label>
                            <div className="flex gap-2">
                                {(["engineering", "legal", "healthcare"] as const).map(id => (
                                    <button
                                        key={id}
                                        onClick={() => setPluginId(id)}
                                        className={`flex-1 font-mono text-xs py-2.5 cursor-pointer border transition-all rounded-md uppercase tracking-[0.05em] ${pluginId === id
                                                ? "bg-[rgba(163,230,53,0.08)] border-lime text-lime"
                                                : "bg-surface border-border text-text-muted"
                                            }`}
                                        style={pluginId === id ? {
                                            borderColor: PLUG_COLORS[id],
                                            color: PLUG_COLORS[id],
                                            background: `${PLUG_COLORS[id]}15`,
                                        } : {}}
                                    >
                                        {id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleGenerate}
                                disabled={genLoading}
                                className="flex-1 bg-lime text-canvas font-mono font-bold text-xs rounded-md py-2.5 hover:opacity-90 disabled:opacity-50 cursor-pointer border-none tracking-[0.06em]"
                            >
                                {genLoading ? "GENERATING..." : "GENERATE KEY →"}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 font-mono text-xs text-text-muted border border-border rounded-md py-2.5 cursor-pointer bg-transparent hover:border-border-hover"
                            >
                                CANCEL
                            </button>
                        </div>
                    </>
                ) : (
                    /* SHOW KEY ONCE */
                    <>
                        <div className="bg-surface border border-[rgba(163,230,53,0.3)] rounded-md p-4 font-mono text-xs text-lime tracking-[0.04em] break-all leading-relaxed mb-3">
                            {newKey}
                        </div>

                        <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)] rounded-md p-3 font-mono text-[11px] text-red-stat mb-5 leading-relaxed">
                            ⚠ This key will NOT be shown again. Copy it now and store it in a password manager or your VS Code settings.
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onCopy}
                                className={`flex-1 flex items-center justify-center gap-2 font-mono font-bold text-xs rounded-md py-2.5 cursor-pointer border-none tracking-[0.06em] transition-all ${copied
                                        ? "bg-[rgba(163,230,53,0.15)] text-lime border border-[rgba(163,230,53,0.4)]"
                                        : "bg-lime text-canvas"
                                    }`}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? "COPIED!" : "COPY KEY"}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 font-mono text-xs text-text-muted border border-border rounded-md py-2.5 cursor-pointer bg-transparent"
                            >
                                DONE
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
