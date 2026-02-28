"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Settings, Book, Key } from "lucide-react";

const MY_PLUGINS = [
    {
        id: "legal-v1",
        name: "Legal SME",
        domain: "Compliance & Contracts",
        color: "#60a5fa",
        icon: "⚖",
        score: 0.93,
        status: "active",
        calls: 3420,
        lastUsed: "2 min ago",
    },
    {
        id: "healthcare-v1",
        name: "Healthcare SME",
        domain: "Clinical & Compliance",
        color: "#34d399",
        icon: "⚕",
        score: 0.91,
        status: "active",
        calls: 2180,
        lastUsed: "1 hour ago",
    },
];

export default function PluginsPage() {
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
                        My Plugins
                    </h1>
                    <p className="font-mono text-sm text-text-muted">
                        Manage your purchased SME plugins
                    </p>
                </div>
                <Link
                    href="/marketplace"
                    className="bg-lime text-canvas font-mono font-bold text-xs tracking-[0.06em] px-5 py-2.5 hover:opacity-90 transition-opacity no-underline"
                >
                    + BUY NEW PLUG
                </Link>
            </div>

            <div className="space-y-4">
                {MY_PLUGINS.map((plug, i) => (
                    <motion.div
                        key={plug.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-surface border border-border rounded-lg p-6"
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            {/* Info */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
                                    style={{
                                        background: `${plug.color}15`,
                                        border: `1px solid ${plug.color}30`,
                                    }}
                                >
                                    {plug.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-display text-lg font-bold text-text-primary">
                                            {plug.name}
                                        </span>
                                        <span className="font-mono text-[10px] bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)] text-plug-healthcare px-2 py-0.5 rounded-[3px]">
                                            {plug.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div
                                        className="font-mono text-[11px] tracking-[0.05em]"
                                        style={{ color: plug.color }}
                                    >
                                        {plug.domain}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="font-mono text-lg font-bold text-lime">
                                        {plug.score.toFixed(2)}
                                    </div>
                                    <div className="font-mono text-[10px] text-text-ghost">
                                        RAGAS
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-mono text-lg font-bold text-text-primary">
                                        {plug.calls.toLocaleString()}
                                    </div>
                                    <div className="font-mono text-[10px] text-text-ghost">
                                        Calls
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-mono text-xs text-text-muted">
                                        {plug.lastUsed}
                                    </div>
                                    <div className="font-mono text-[10px] text-text-ghost">
                                        Last used
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Link
                                    href={`/plugins/${plug.id}/configure`}
                                    className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted border border-border rounded-md px-3 py-2 hover:border-lime hover:text-lime transition-all no-underline"
                                >
                                    <Settings size={12} /> Configure
                                </Link>
                                <Link
                                    href={`/plugins/${plug.id}/docs`}
                                    className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted border border-border rounded-md px-3 py-2 hover:border-border-hover hover:text-text-primary transition-all no-underline"
                                >
                                    <Book size={12} /> Docs
                                </Link>
                                <Link
                                    href="/api-keys"
                                    className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted border border-border rounded-md px-3 py-2 hover:border-border-hover hover:text-text-primary transition-all no-underline"
                                >
                                    <Key size={12} /> Keys
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
