"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Settings, Book } from "lucide-react";
import { useOwnedPlugins } from "@/lib/useOwnedPlugins";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function formatTimeAgo(dateString: string | null) {
    if (!dateString) return "Never";
    const then = new Date(dateString).getTime();
    if (isNaN(then)) return "Never";

    const now = Date.now();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return `Yesterday`;
    return `${diffDays} days ago`;
}

export default function PluginsPage() {
    type PluginData = { id: string; domain: string; name: string; color: string; bg?: string; border?: string; icon?: string; ragasScore?: number; tags?: string[]; description?: string; price?: number; };

    const { owned, ready: ownedReady } = useOwnedPlugins();

    // Fetch dynamic usage data
    const { data: usageRes } = useSWR("/api/plugins/usage", fetcher, {
        revalidateOnFocus: true,
    });
    const usageData = usageRes?.usage || {};

    const { data: pluginsData, isLoading: pluginsLoading } = useSWR("/api/plugins", fetcher);
    const ALL_PLUGS: PluginData[] = pluginsData?.plugins || [];

    if (!ownedReady || pluginsLoading) return null; // Wait for hydration

    // Map owned plug IDs to their full data objects
    const myPlugins = owned
        .map((id) => ALL_PLUGS.find((p: PluginData) => p.id === id))
        .filter(Boolean) as PluginData[];

    return (
        <div className="space-y-8">
            <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="ui-page-title text-3xl mb-2">
                        My Plugins
                    </h1>
                    <p className="ui-page-subtitle">
                        Manage your purchased SME plugins
                    </p>
                </div>
                <Link
                    href="/marketplace"
                    className="bg-lime text-canvas font-mono font-bold text-xs tracking-[0.06em] px-5 py-2.5 hover:opacity-90 transition-opacity no-underline rounded-md"
                >
                    + BUY NEW PLUG
                </Link>
            </div>

            {myPlugins.length === 0 ? (
                <div className="section-card p-12 text-center">
                    <div className="text-4xl mb-4">🧩</div>
                    <div className="font-display text-xl font-bold text-text-primary mb-2">
                        No plugins yet
                    </div>
                    <div className="font-mono text-sm text-text-ghost max-w-sm mx-auto mb-6">
                        Head over to the marketplace to purchase your first SME expert plugin.
                    </div>
                    <Link
                        href="/marketplace"
                        className="inline-block bg-canvas border border-border text-text-primary font-mono font-bold text-xs tracking-[0.06em] px-5 py-2.5 rounded hover:border-border-hover transition-colors no-underline"
                    >
                        BROWSE MARKETPLACE
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {myPlugins.map((plug: PluginData, i: number) => (
                        <Link href={`/plugins/${plug.id}`} key={plug.id} className="block no-underline">
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-surface border border-border rounded-lg p-6 hover:border-lime/50 transition-colors"
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
                                            {plug.icon || "💠"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-display text-lg font-bold text-text-primary">
                                                    {plug.name}
                                                </span>
                                                <span className="font-mono text-[10px] bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)] text-plug-healthcare px-2 py-0.5 rounded-[3px]">
                                                    ACTIVE
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
                                                {plug.ragasScore ? plug.ragasScore.toFixed(2) : "0.90"}
                                            </div>
                                            <div className="font-mono text-[10px] text-text-ghost">
                                                RAGAS
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-mono text-lg font-bold text-text-primary">
                                                {usageData[plug.id]?.calls || 0}
                                            </div>
                                            <div className="font-mono text-[10px] text-text-ghost">
                                                Calls
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-mono text-xs text-text-muted">
                                                {formatTimeAgo(usageData[plug.id]?.lastUsed)}
                                            </div>
                                            <div className="font-mono text-[10px] text-text-ghost">
                                                Last used
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <div
                                            className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted border border-border rounded-md px-3 py-2 hover:border-lime hover:text-lime transition-all"
                                        >
                                            <Settings size={12} /> Configure
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
