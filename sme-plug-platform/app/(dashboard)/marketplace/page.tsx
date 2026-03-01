"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Check } from "lucide-react";
import useSWR from "swr";
import { useOwnedPlugins } from "@/lib/useOwnedPlugins";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MarketplacePage() {
    type PluginData = { id: string; domain: string; name: string; color: string; bg?: string; border?: string; icon?: string; ragasScore?: number; tags?: string[]; description?: string; price?: number; };

    const [search, setSearch] = useState("");
    const [selectedDomain, setSelectedDomain] = useState("all");
    const { owned, buyPlugin, isOwned, ready: ownedReady } = useOwnedPlugins();

    const { data: pluginsData, isLoading: pluginsLoading } = useSWR("/api/plugins", fetcher);
    const ALL_PLUGS: PluginData[] = pluginsData?.plugins || [];

    const domains = ["all", ...new Set(ALL_PLUGS.map((p: PluginData) => p.domain))];

    const filtered = ALL_PLUGS.filter((p: PluginData) => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.domain.toLowerCase().includes(search.toLowerCase());
        const matchesDomain =
            selectedDomain === "all" || p.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    });

    if (!ownedReady || pluginsLoading) return null; // Wait for localStorage & DB to hydrate

    return (
        <div className="space-y-8">
            <div className="page-header">
                <h1 className="ui-page-title text-3xl mb-2">
                    Marketplace
                </h1>
                <p className="ui-page-subtitle">
                    Browse and purchase SME expert plugins
                </p>
            </div>

            {/* Filters */}
            <div className="section-card p-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ghost"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search plugins..."
                        className="w-full bg-surface border border-border rounded-md pl-9 pr-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-ghost outline-none focus:border-lime transition-colors"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-text-ghost" />
                    <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="bg-surface border border-border rounded-md px-3 py-2.5 font-mono text-sm text-text-primary outline-none focus:border-lime cursor-pointer"
                    >
                        {domains.map((d: any) => (
                            <option key={d as string} value={d as string} className="bg-canvas">
                                {d === "all" ? "All Domains" : d as string}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((plug: PluginData, i: number) => {
                    const alreadyOwned = isOwned(plug.id);

                    return (
                        <motion.div
                            key={plug.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-surface border border-border rounded-lg p-6 hover:border-border-hover transition-all group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                    style={{ background: plug.bg || `${plug.color}15`, border: `1px solid ${plug.border || plug.color}` }}
                                >
                                    {plug.icon || "💠"}
                                </div>
                                <div className="font-mono text-lg font-bold text-lime">
                                    {plug.ragasScore ? plug.ragasScore.toFixed(2) : "0.90"}
                                </div>
                            </div>
                            <div
                                className="font-mono text-[10px] tracking-[0.1em] uppercase mb-1"
                                style={{ color: plug.color }}
                            >
                                {plug.domain}
                            </div>
                            <div className="font-display text-lg font-bold text-text-primary mb-2">
                                {plug.name}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-4">
                                {(plug.tags || plug.description?.split(", ") || []).slice(0, 3).map((t: string) => (
                                    <span
                                        key={t}
                                        className="font-mono text-[10px] bg-canvas border border-border text-text-muted px-1.5 py-0.5 rounded-[3px]"
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                                <div>
                                    <span className="font-mono text-xl font-bold text-text-primary">
                                        ${plug.price}
                                    </span>
                                    <span className="font-mono text-[11px] text-text-faint">
                                        /mo
                                    </span>
                                </div>

                                {alreadyOwned ? (
                                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-[0.05em] px-4 py-2 text-text-ghost bg-canvas border border-border rounded cursor-default">
                                        <Check size={12} /> Owned
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => buyPlugin(plug.id)}
                                        className="font-mono text-[11px] font-bold tracking-[0.05em] px-4 py-2 cursor-pointer transition-all border rounded"
                                        style={{
                                            background: "transparent",
                                            borderColor: plug.color,
                                            color: plug.color,
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.target as HTMLElement).style.background = plug.color;
                                            (e.target as HTMLElement).style.color = "#0a0a0f";
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.target as HTMLElement).style.background = "transparent";
                                            (e.target as HTMLElement).style.color = plug.color;
                                        }}
                                    >
                                        BUY PLUG →
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
