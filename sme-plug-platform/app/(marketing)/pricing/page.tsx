"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/data";

const FAQ = [
    { q: "Can I switch plans anytime?", a: "Yes. Upgrade or downgrade at any point — billing is prorated automatically." },
    { q: "What counts as a query?", a: "Each API call to a plug counts as one query. Cached responses do not count." },
    { q: "Do you offer a free trial?", a: "Yes — every plan includes a 14-day free trial with full access. No credit card required." },
    { q: "How does per-plug pricing work?", a: "You pay per plug per month. If you have 3 plugs on the Pro plan, it's $1,500 × 3 = $4,500/month." },
    { q: "What's included in Enterprise?", a: "Unlimited plugs and queries, custom plug builder, SLA guarantee, dedicated CSM, and SSO + audit logs." },
];

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-canvas">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-[rgba(8,8,12,0.9)] backdrop-blur-xl border-b border-border">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 no-underline">
                        <div className="w-6 h-6" style={{ background: "linear-gradient(135deg,#a3e635,#65a30d)", clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />
                        <span className="font-mono font-bold text-base text-text-primary tracking-tight">sme<span className="text-lime">plug</span></span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="font-mono text-[13px] text-text-muted no-underline hover:text-text-primary">Login</Link>
                        <Link href="/register" className="font-mono text-[11px] font-bold tracking-[0.08em] bg-lime text-canvas px-4 py-2 no-underline hover:opacity-90">GET STARTED →</Link>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="font-mono text-[11px] text-lime tracking-[0.15em] mb-4">PRICING</div>
                    <h1 className="font-display text-5xl md:text-6xl font-bold text-text-primary mb-4">Pay per plug, not per seat</h1>
                    <p className="font-mono text-base text-text-muted max-w-xl mx-auto">Every plan includes API access, the configurator, IDE plugins, and RAGAS scoring. No hidden fees.</p>
                </motion.div>
            </section>

            {/* Plans */}
            <section className="max-w-5xl mx-auto px-6 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan, i) => (
                        <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className={`relative rounded-lg p-8 flex flex-col ${plan.highlight ? "bg-[rgba(163,230,53,0.04)] border-2 border-lime" : "bg-surface border border-border"}`}>
                            {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime text-canvas font-mono text-[10px] font-bold tracking-[0.12em] px-3 py-1">MOST POPULAR</div>}
                            <div className="font-mono text-[10px] text-text-faint tracking-[0.1em] mb-2">{plan.name.toUpperCase()}</div>
                            <div className="mb-1">
                                <span className="font-display text-5xl font-bold text-text-primary">${plan.price.toLocaleString()}</span>
                                <span className="font-mono text-sm text-text-ghost">/plug/month</span>
                            </div>
                            <div className="font-mono text-xs text-text-muted mb-6">{plan.limit}</div>
                            <div className="space-y-3 mb-8 flex-1">
                                {plan.features.map((f) => (
                                    <div key={f} className="flex items-center gap-2">
                                        <Check size={14} className="text-lime shrink-0" />
                                        <span className="font-mono text-sm text-text-secondary">{f}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/register"
                                className={`block text-center font-mono text-[11px] font-bold tracking-[0.06em] px-6 py-3 no-underline transition-opacity ${plan.highlight ? "bg-lime text-canvas hover:opacity-90" : "border border-border text-text-muted hover:border-lime hover:text-lime"}`}>
                                {plan.cta.toUpperCase()} →
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Compare */}
            <section className="max-w-5xl mx-auto px-6 pb-20">
                <div className="bg-surface border border-border rounded-lg overflow-x-auto">
                    <table className="w-full">
                        <thead><tr className="border-b border-border">
                            <th className="text-left font-mono text-[10px] text-text-ghost tracking-[0.1em] px-6 py-4">FEATURE</th>
                            {PLANS.map(p => <th key={p.name} className="text-center font-mono text-[10px] text-text-ghost tracking-[0.1em] px-6 py-4">{p.name.toUpperCase()}</th>)}
                        </tr></thead>
                        <tbody>
                            {[
                                ["SME plugs", "2", "5", "Unlimited"],
                                ["Queries/month", "10k", "100k", "Unlimited"],
                                ["API key access", "✓", "✓", "✓"],
                                ["Custom configurator", "—", "✓", "✓"],
                                ["RAGAS dashboard", "—", "✓", "✓"],
                                ["Priority support", "—", "✓", "✓"],
                                ["Custom plug builder", "—", "—", "✓"],
                                ["SLA guarantee", "—", "—", "✓"],
                                ["SSO + audit logs", "—", "—", "✓"],
                                ["Dedicated CSM", "—", "—", "✓"],
                            ].map(([feature, ...vals], i) => (
                                <tr key={i} className="border-b border-border last:border-b-0">
                                    <td className="px-6 py-3 font-mono text-xs text-text-primary">{feature}</td>
                                    {vals.map((v, j) => <td key={j} className={`px-6 py-3 text-center font-mono text-xs ${v === "✓" ? "text-lime" : v === "—" ? "text-text-ghost" : "text-text-muted"}`}>{v}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQ */}
            <section className="max-w-3xl mx-auto px-6 pb-20">
                <h2 className="font-display text-3xl font-bold text-text-primary text-center mb-10">Frequently asked questions</h2>
                <div className="space-y-4">
                    {FAQ.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                            className="bg-surface border border-border rounded-lg p-5">
                            <div className="font-mono text-sm font-semibold text-text-primary mb-2">{item.q}</div>
                            <div className="font-mono text-xs text-text-muted leading-[1.7]">{item.a}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
                <h2 className="font-display text-4xl font-bold text-text-primary mb-4">Start your free trial today</h2>
                <p className="font-mono text-sm text-text-muted mb-8">14 days free. No credit card required. Cancel anytime.</p>
                <Link href="/register" className="inline-block bg-lime text-canvas font-mono text-[11px] font-bold tracking-[0.08em] px-8 py-3 no-underline hover:opacity-90">GET STARTED FREE →</Link>
            </section>
        </main>
    );
}
