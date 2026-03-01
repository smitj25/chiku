"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, ArrowUpRight } from "lucide-react";
import { backendUrl, publicRuntime } from "@/lib/public-runtime";

interface UsageData {
    total_calls_this_month: number;
    user_calls_this_month: number;
    per_plugin: Record<string, number>;
    limit: number;
    month: string;
    days_left: number;
}

const INVOICES = [
    { id: "INV-001", date: "2025-01-01", amount: "$1,000", status: "paid" },
    { id: "INV-002", date: "2024-12-01", amount: "$1,000", status: "paid" },
    { id: "INV-003", date: "2024-11-01", amount: "$500", status: "paid" },
];

export default function BillingPage() {
    const [usage, setUsage] = useState<UsageData | null>(null);

    useEffect(() => {
        fetch(backendUrl("/v1/usage"), {
            headers: { "x-api-key": publicRuntime.demoApiKey },
        })
            .then(res => res.json())
            .then(setUsage)
            .catch(() => null);
    }, []);

    const totalCalls = usage?.total_calls_this_month ?? 0;
    const limit = usage?.limit ?? 10000;
    const daysLeft = usage?.days_left ?? 0;
    const pctUsed = limit > 0 ? Math.round((totalCalls / limit) * 100) : 0;
    const legalCalls = usage?.per_plugin?.["legal"] ?? 0;
    const healthCalls = usage?.per_plugin?.["healthcare"] ?? 0;

    return (
        <div className="space-y-10">
            <div className="page-header">
                <h1 className="ui-page-title text-4xl mb-3">Billing</h1>
                <p className="ui-page-subtitle">Your plan, usage, and invoices</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current plan */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-[rgba(163,230,53,0.04)] border border-[rgba(163,230,53,0.2)] rounded-xl p-7 lg:col-span-1">
                    <div className="font-mono text-xs text-lime tracking-[0.12em] font-medium mb-4">CURRENT PLAN</div>
                    <div className="font-display text-4xl font-bold text-text-primary mb-2">Starter</div>
                    <div className="font-mono text-sm text-text-muted mb-5">$500 / plug / month</div>
                    <div className="space-y-3 mb-7">
                        {["2 SME plugs", "10k queries/month", "API key access", "Community support"].map((f, i) => (
                            <div key={i} className="flex gap-2.5 items-center">
                                <span className="text-lime font-mono text-sm">✓</span>
                                <span className="font-mono text-sm text-text-muted">{f}</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 bg-lime text-canvas font-mono font-bold text-sm py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none">
                        <ArrowUpRight size={16} /> UPGRADE PLAN
                    </button>
                </motion.div>

                {/* Usage + cost */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-surface border border-border rounded-xl p-7">
                        <div className="font-mono text-xs text-text-faint tracking-[0.12em] font-medium mb-5">API USAGE THIS MONTH</div>
                        <div className="flex justify-between items-end mb-4">
                            <div className="font-display text-5xl font-bold text-text-primary">{totalCalls.toLocaleString()}</div>
                            <div className="font-mono text-sm text-text-ghost">/ {limit.toLocaleString()} limit</div>
                        </div>
                        <div className="w-full h-3 bg-canvas rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                                width: `${Math.min(pctUsed, 100)}%`,
                                background: pctUsed > 80
                                    ? "linear-gradient(90deg, #fbbf24, #f85149)"
                                    : "linear-gradient(90deg,#a3e635,#65a30d)"
                            }} />
                        </div>
                        <div className="flex justify-between mt-3">
                            <span className="font-mono text-xs text-text-ghost">{pctUsed}% used</span>
                            <span className="font-mono text-xs text-text-ghost">Resets in {daysLeft} days</span>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-surface border border-border rounded-xl p-7">
                        <div className="font-mono text-xs text-text-faint tracking-[0.12em] font-medium mb-5">COST BREAKDOWN</div>
                        <div className="space-y-4">
                            {[
                                { name: "Legal SME", cost: "$500", calls: legalCalls },
                                { name: "Healthcare SME", cost: "$500", calls: healthCalls },
                            ].map((p, i) => (
                                <div key={i} className="flex items-center justify-between bg-canvas border border-border rounded-lg px-5 py-4">
                                    <div className="font-mono text-sm text-text-primary font-medium">{p.name}</div>
                                    <div className="text-right">
                                        <div className="font-mono text-sm font-bold text-text-primary">{p.cost}<span className="text-text-ghost font-normal">/mo</span></div>
                                        <div className="font-mono text-xs text-text-ghost mt-0.5">{p.calls.toLocaleString()} calls</div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-between pt-4 border-t border-border">
                                <span className="font-mono text-sm text-text-muted">Total this month</span>
                                <span className="font-mono text-xl font-bold text-lime">$1,000</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Invoices */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                    <CreditCard size={16} className="text-text-ghost" />
                    <span className="font-mono text-xs text-text-faint tracking-[0.12em] font-medium">INVOICE HISTORY</span>
                </div>
                <table className="w-full">
                    <thead><tr className="border-b border-border">
                        {["Invoice", "Date", "Amount", "Status"].map(h => (<th key={h} className="text-left font-mono text-xs text-text-ghost tracking-[0.1em] px-5 py-4">{h}</th>))}
                    </tr></thead>
                    <tbody>{INVOICES.map((inv) => (
                        <tr key={inv.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
                            <td className="px-5 py-4 font-mono text-sm text-text-primary">{inv.id}</td>
                            <td className="px-5 py-4 font-mono text-sm text-text-ghost">{inv.date}</td>
                            <td className="px-5 py-4 font-mono text-sm text-text-primary font-bold">{inv.amount}</td>
                            <td className="px-5 py-4"><span className="font-mono text-xs bg-[rgba(52,211,153,0.1)] text-plug-healthcare border border-[rgba(52,211,153,0.3)] px-2.5 py-1 rounded">{inv.status.toUpperCase()}</span></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}
