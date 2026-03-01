'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldCheck, ShieldAlert, FileText, Sparkles, Zap, BookOpen } from 'lucide-react';
import { backendUrl, publicRuntime } from "@/lib/public-runtime";

const PLUGINS = [
    { id: 'legal', label: 'Legal', color: '#60a5fa', icon: '⚖️' },
    { id: 'healthcare', label: 'Healthcare', color: '#34d399', icon: '🏥' },
    { id: 'engineering', label: 'Engineering', color: '#fbbf24', icon: '⚙️' },
];

const EXAMPLE_QUERIES = [
    'What are the GDPR penalties under Article 83?',
    'What is the data breach notification timeline?',
    'Who is the Data Protection Officer at Acme?',
];

interface CompareResult {
    query: string;
    plug_id: string;
    raw: {
        response: string;
        citations: string[];
        has_citations: boolean;
        label: string;
        risk: string;
    };
    sme: {
        response: string;
        citations: string[];
        has_citations: boolean;
        label: string;
        risk: string;
        chunks_used: number;
    };
    verdict: {
        hallucination_detected: boolean;
        sme_verified: boolean;
        summary: string;
    };
}

function CitationBadge({ text, verified }: { text: string; verified: boolean }) {
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-semibold leading-tight mx-0.5 align-baseline"
            style={{
                background: verified ? 'rgba(163,230,53,0.1)' : 'rgba(248,81,73,0.1)',
                color: verified ? '#a3e635' : '#f85149',
            }}
        >
            {verified ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
            {text.replace(/^\[|\]$/g, '')}
        </span>
    );
}

function formatResponse(text: string, verified: boolean) {
    const parts = text.split(/(\[Source:[^\]]+\])/g);
    return parts.map((part, i) =>
        part.match(/^\[Source:/) ? (
            <CitationBadge key={i} text={part} verified={verified} />
        ) : (
            <span key={i}>{part}</span>
        ),
    );
}

export default function ComparePage() {
    const [query, setQuery] = useState('');
    const [plugId, setPlugId] = useState('legal');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CompareResult | null>(null);

    const runComparison = async (q?: string) => {
        const text = q ?? query;
        if (!text.trim()) return;
        setQuery(text);
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(backendUrl("/v1/compare"), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': publicRuntime.demoApiKey },
                body: JSON.stringify({ message: text, plug_id: plugId }),
            });
            setResult(await res.json());
        } catch {
            /* ignore */
        }
        setLoading(false);
    };

    const activePlugin = PLUGINS.find((p) => p.id === plugId)!;

    return (
        <div className="space-y-6">
            {/* ─── Header ────────────────────────────────────────────── */}
            <div className="page-header mb-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(163,230,53,0.08)] border border-[rgba(163,230,53,0.2)]">
                        <Sparkles size={20} className="text-lime" />
                    </div>
                    <div>
                        <h1 className="ui-page-title text-3xl leading-tight">
                            Hallucination Comparison
                        </h1>
                    </div>
                </div>
                <p className="ui-page-subtitle mt-2">
                    The same question runs through a raw LLM and through Tether simultaneously.
                    Watch how unverified AI invents citations while Tether grounds its answers in your actual documents.
                </p>
            </div>

            {/* ─── Controls ──────────────────────────────────────────── */}
            <div className="section-card p-6">
                {/* Plugin selector */}
                <div className="flex items-center gap-2 mb-5">
                    <span className="font-mono text-xs text-text-ghost tracking-widest mr-1">DOMAIN</span>
                    {PLUGINS.map((p) => {
                        const active = plugId === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setPlugId(p.id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer"
                                style={{
                                    background: active ? `${p.color}14` : 'transparent',
                                    border: `1.5px solid ${active ? p.color : 'rgba(255,255,255,0.06)'}`,
                                    color: active ? p.color : 'rgba(255,255,255,0.35)',
                                }}
                            >
                                <span>{p.icon}</span> {p.label}
                            </button>
                        );
                    })}
                </div>

                {/* Query input */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && runComparison()}
                            placeholder="Ask a question to compare…"
                            className="w-full px-5 py-3 pr-12 rounded-xl font-mono text-sm bg-canvas text-white placeholder-[rgba(255,255,255,0.2)] outline-none border border-border focus:border-[rgba(163,230,53,0.4)] transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => runComparison()}
                        disabled={loading || !query.trim()}
                        className="flex items-center gap-2 px-7 py-3 rounded-xl font-mono text-sm font-bold transition-all cursor-pointer border-none disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #a3e635, #65a30d)', color: '#0a0a0e' }}
                    >
                        {loading ? (
                            <span className="animate-spin">⟳</span>
                        ) : (
                            <Send size={15} />
                        )}
                        {loading ? 'Running…' : 'Compare'}
                    </button>
                </div>

                {/* Example queries */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="font-mono text-[11px] text-text-ghost">Examples:</span>
                    {EXAMPLE_QUERIES.map((eq, i) => (
                        <button
                            key={i}
                            onClick={() => runComparison(eq)}
                            className="px-3 py-1.5 rounded-lg font-mono text-[11px] transition-all cursor-pointer bg-canvas text-text-muted border border-border hover:border-border-hover hover:text-text-primary"
                        >
                            {eq}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ─── Loading skeleton ────────────────────────────────── */}
                {loading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                    >
                        {[0, 1].map((i) => (
                            <div
                                key={i}
                                className="rounded-2xl p-7 animate-pulse bg-surface border border-border"
                            >
                                <div className="h-4 w-36 bg-canvas rounded mb-6" />
                                <div className="space-y-3">
                                    {[100, 85, 70, 90, 60].map((w, j) => (
                                        <div key={j} className="h-3.5 bg-canvas rounded" style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ─── Results ─────────────────────────────────────────── */}
                {result && !loading && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                    >
                        {/* Verdict */}
                        <div
                            className="rounded-2xl p-5 flex items-center gap-4"
                            style={{
                                background: result.verdict.sme_verified
                                    ? 'rgba(163,230,53,0.04)'
                                    : 'rgba(251,191,36,0.04)',
                                border: `1.5px solid ${result.verdict.sme_verified
                                        ? 'rgba(163,230,53,0.2)'
                                        : 'rgba(251,191,36,0.2)'
                                    }`,
                            }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                                background: result.verdict.sme_verified ? 'rgba(163,230,53,0.1)' : 'rgba(251,191,36,0.1)',
                            }}>
                                {result.verdict.sme_verified ? (
                                    <ShieldCheck size={20} className="text-lime" />
                                ) : (
                                    <BookOpen size={20} style={{ color: '#fbbf24' }} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-mono text-sm font-bold text-text-primary">
                                    {result.verdict.sme_verified
                                        ? 'Hallucination Caught — Tether verified against real documents'
                                        : 'Upload documents for full verification'}
                                </span>
                                <p className="font-mono text-xs text-text-muted mt-0.5 leading-relaxed">
                                    {result.verdict.summary}
                                </p>
                            </div>
                        </div>

                        {/* Side-by-side panels */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* ── LEFT: Raw LLM ── */}
                            <ResponsePanel
                                title={result.raw.label}
                                subtitle="No RAG · No persona · No guardrails"
                                color="#f85149"
                                response={result.raw.response}
                                citations={result.raw.citations}
                                verified={false}
                                badgeText={`${result.raw.citations.length} unverified`}
                                icon={<ShieldAlert size={16} />}
                            />

                            {/* ── RIGHT: Tether ── */}
                            <ResponsePanel
                                title={result.sme.label}
                                subtitle={`RAG · Persona · Guardrails · ${result.sme.chunks_used} doc chunks`}
                                color={activePlugin.color}
                                response={result.sme.response}
                                citations={result.sme.citations}
                                verified={true}
                                badgeText={`${result.sme.citations.length} verified`}
                                icon={<ShieldCheck size={16} />}
                            />
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Raw citations', value: String(result.raw.citations.length), color: '#f85149', note: 'Unverified' },
                                { label: 'SME citations', value: String(result.sme.citations.length), color: '#a3e635', note: 'Verified' },
                                { label: 'Chunks used', value: String(result.sme.chunks_used), color: activePlugin.color, note: 'Retrieved' },
                                {
                                    label: 'Risk level',
                                    value: result.sme.has_citations ? 'LOW' : 'MED',
                                    color: result.sme.has_citations ? '#a3e635' : '#fbbf24',
                                    note: result.sme.has_citations ? 'Grounded' : 'No docs',
                                },
                            ].map((s, i) => (
                                <div key={i} className="bg-surface border border-border rounded-xl p-4 text-center">
                                    <div className="font-mono text-[10px] text-text-ghost tracking-widest mb-2">
                                        {s.label.toUpperCase()}
                                    </div>
                                    <div className="font-display text-2xl font-extrabold leading-none" style={{ color: s.color }}>
                                        {s.value}
                                    </div>
                                    <div className="font-mono text-[10px] text-text-ghost mt-1">{s.note}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ─── Empty state ─────────────────────────────────────── */}
                {!result && !loading && (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl p-16 text-center bg-surface border border-border"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[rgba(163,230,53,0.06)] border border-[rgba(163,230,53,0.15)] mb-5">
                            <Zap size={28} className="text-lime" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-text-primary mb-2">
                            Ready to expose hallucinations
                        </h3>
                        <p className="font-mono text-xs text-text-ghost max-w-sm mx-auto leading-relaxed">
                            Type a question or pick an example above. The same query runs through
                            raw AI and SME-Plug simultaneously — watch how citations differ.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Reusable response panel ────────────────────────────────────────────── */

function ResponsePanel({
    title,
    subtitle,
    color,
    response,
    citations,
    verified,
    badgeText,
    icon,
}: {
    title: string;
    subtitle: string;
    color: string;
    response: string;
    citations: string[];
    verified: boolean;
    badgeText: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl overflow-hidden bg-surface" style={{ border: `1.5px solid ${color}22` }}>
            {/* Header */}
            <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ background: `${color}08`, borderBottom: `1px solid ${color}15` }}
            >
                <div className="min-w-0">
                    <div className="font-mono text-sm font-bold" style={{ color }}>
                        {title}
                    </div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: `${color}80` }}>
                        {subtitle}
                    </div>
                </div>
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold shrink-0"
                    style={{
                        background: `${color}10`,
                        border: `1px solid ${color}25`,
                        color,
                    }}
                >
                    {icon}
                    {badgeText}
                </div>
            </div>

            {/* Response body */}
            <div className="px-5 py-5">
                <div className="font-mono text-[13px] text-[#c9d1d9] leading-[1.8] whitespace-pre-wrap">
                    {formatResponse(response, verified)}
                </div>
            </div>

            {/* Citations footer */}
            {citations.length > 0 && (
                <div className="px-5 py-4" style={{ borderTop: `1px solid ${color}10` }}>
                    <div className="flex items-center gap-2 mb-2.5">
                        <FileText size={12} style={{ color }} />
                        <span className="font-mono text-[11px] font-bold" style={{ color }}>
                            {verified ? 'VERIFIED CITATIONS' : 'UNVERIFIED CITATIONS'}
                        </span>
                    </div>
                    <div className="space-y-1.5">
                        {citations.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 font-mono text-[11px]" style={{ color: `${color}90` }}>
                                <span style={{ color }}>{verified ? '✓' : '✗'}</span>
                                <span>{c}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
