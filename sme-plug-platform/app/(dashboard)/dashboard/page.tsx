"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Key, Settings, ArrowRight } from "lucide-react";
import { backendUrl, publicRuntime } from "@/lib/public-runtime";

interface UsageData {
    total_calls_this_month: number;
    user_calls_this_month: number;
    per_plugin: Record<string, number>;
    limit: number;
    month: string;
    days_left: number;
}

const ACTIVE_PLUGINS = [
    { name: "Legal SME", domain: "Compliance & Contracts", color: "#60a5fa", score: 0.93, plugId: "legal" },
    { name: "Healthcare SME", domain: "Clinical & Compliance", color: "#34d399", score: 0.91, plugId: "healthcare" },
];

const RECENT_ACTIVITY = [
    { action: "API key generated", detail: "Production — Legal SME", time: "2 min ago" },
    { action: "Plugin configured", detail: "Updated guardrails for Healthcare SME", time: "1 hour ago" },
    { action: "Query limit alert", detail: "80% of monthly quota used", time: "3 hours ago" },
    { action: "New plugin purchased", detail: "Healthcare SME — Pro plan", time: "1 day ago" },
];

export default function DashboardPage() {
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

    return (
        <div className="space-y-10">
            <div className="page-header">
                <h1 className="ui-page-title text-4xl mb-3">
                    Dashboard
                </h1>
                <p className="ui-page-subtitle">
                    Overview of your Tether workspace
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {[
                    { label: "Active Plugins", value: "2", sub: "of 2 available", accent: "#a3e635" },
                    { label: "API Calls (this month)", value: totalCalls.toLocaleString(), sub: `of ${limit.toLocaleString()} limit`, accent: "#60a5fa" },
                    { label: "Avg RAGAS Score", value: "0.92", sub: "across all plugs", accent: "#34d399" },
                    { label: "API Keys", value: "3", sub: "2 active, 1 revoked", accent: "#fbbf24" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-surface border border-border rounded-xl p-6"
                    >
                        <div className="font-mono text-xs text-text-faint tracking-[0.12em] mb-3 font-medium">
                            {stat.label.toUpperCase()}
                        </div>
                        <div
                            className="font-display text-4xl font-bold leading-none mb-2"
                            style={{ color: stat.accent }}
                        >
                            {stat.value}
                        </div>
                        <div className="font-mono text-xs text-text-ghost">
                            {stat.sub}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { icon: Zap, label: "Buy new plug", desc: "Browse marketplace", href: "/marketplace", color: "#a3e635" },
                    { icon: Key, label: "Generate API key", desc: "For your plugins", href: "/api-keys", color: "#60a5fa" },
                    { icon: Settings, label: "Configure plug", desc: "Persona & guardrails", href: "/plugins", color: "#fbbf24" },
                ].map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className="group bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all no-underline flex items-center gap-5"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${action.color}15`, border: `1px solid ${action.color}30` }}
                        >
                            <action.icon size={20} style={{ color: action.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm text-text-primary font-semibold">
                                {action.label}
                            </div>
                            <div className="font-mono text-xs text-text-faint mt-0.5">
                                {action.desc}
                            </div>
                        </div>
                        <ArrowRight
                            size={16}
                            className="text-text-ghost group-hover:text-text-muted transition-colors"
                        />
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active plugins */}
                <div className="bg-surface border border-border rounded-xl p-7">
                    <div className="flex justify-between items-center mb-6">
                        <div className="font-mono text-xs text-text-faint tracking-[0.12em] font-medium">
                            ACTIVE PLUGINS
                        </div>
                        <Link
                            href="/plugins"
                            className="font-mono text-xs text-lime no-underline hover:underline"
                        >
                            View all →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {ACTIVE_PLUGINS.map((plug, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 rounded-lg bg-canvas border border-border"
                            >
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ background: plug.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-sm text-text-primary font-medium">
                                        {plug.name}
                                    </div>
                                    <div className="font-mono text-xs text-text-ghost mt-0.5">
                                        {plug.domain}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="font-mono text-sm text-lime font-bold">
                                        {plug.score.toFixed(2)}
                                    </div>
                                    <div className="font-mono text-xs text-text-ghost mt-0.5">
                                        {(usage?.per_plugin?.[plug.plugId] ?? 0).toLocaleString()} calls
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent activity */}
                <div className="bg-surface border border-border rounded-xl p-7">
                    <div className="font-mono text-xs text-text-faint tracking-[0.12em] font-medium mb-6">
                        RECENT ACTIVITY
                    </div>
                    <div className="space-y-4">
                        {RECENT_ACTIVITY.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-4 p-4 rounded-lg bg-canvas border border-border"
                            >
                                <div className="w-2 h-2 rounded-full bg-lime mt-2 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-sm text-text-primary font-medium">
                                        {item.action}
                                    </div>
                                    <div className="font-mono text-xs text-text-ghost mt-0.5">
                                        {item.detail}
                                    </div>
                                </div>
                                <div className="font-mono text-xs text-text-ghost shrink-0">
                                    {item.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Usage meter */}
            <div className="bg-surface border border-border rounded-xl p-7">
                <div className="flex justify-between items-center mb-5">
                    <div className="font-mono text-xs text-text-faint tracking-[0.12em] font-medium">
                        API USAGE THIS MONTH
                    </div>
                    <div className="font-mono text-sm text-text-muted font-medium">
                        {totalCalls.toLocaleString()} / {limit.toLocaleString()}
                    </div>
                </div>
                <div className="w-full h-3 bg-canvas rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${Math.min(pctUsed, 100)}%`,
                            background: pctUsed > 80
                                ? "linear-gradient(90deg, #fbbf24, #f85149)"
                                : "linear-gradient(90deg, #a3e635, #65a30d)",
                        }}
                    />
                </div>
                <div className="flex justify-between mt-3">
                    <div className="font-mono text-xs text-text-ghost">{pctUsed}% used</div>
                    <div className="font-mono text-xs text-text-ghost">
                        Resets in {daysLeft} days
                    </div>
                </div>
            </div>
        </div>
    );
}
