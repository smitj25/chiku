"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { PLUGS } from "@/lib/data";

const ALL_PLUGS = [
    ...PLUGS,
    {
        id: "finance",
        name: "Finance SME",
        domain: "Banking & Risk",
        color: "#c084fc",
        bg: "rgba(192,132,252,0.08)",
        border: "rgba(192,132,252,0.25)",
        score: 0.89,
        price: 500,
        icon: "💹",
        tags: ["Risk Models", "Basel III", "Fraud Detection", "KYC"],
        example: "Evaluate credit risk exposure for portfolio segment A under Basel III.",
    },
    {
        id: "education",
        name: "Education SME",
        domain: "Curriculum & Assessment",
        color: "#f472b6",
        bg: "rgba(244,114,182,0.08)",
        border: "rgba(244,114,182,0.25)",
        score: 0.88,
        price: 500,
        icon: "📚",
        tags: ["Curriculum Design", "Assessment", "Bloom's Taxonomy", "IEP"],
        example: "Create a rubric for evaluating 8th-grade argumentative essays.",
    },
    {
        id: "cyber",
        name: "Cybersecurity SME",
        domain: "Threat & Compliance",
        color: "#fb923c",
        bg: "rgba(251,146,60,0.08)",
        border: "rgba(251,146,60,0.25)",
        score: 0.90,
        price: 500,
        icon: "🛡",
        tags: ["NIST", "SOC 2", "Pen Testing", "Incident Response"],
        example: "Assess NIST CSF compliance gaps for cloud infrastructure.",
    },
];

export default function MarketplacePage() {
    const [search, setSearch] = useState("");
    const [selectedDomain, setSelectedDomain] = useState("all");

    const domains = ["all", ...new Set(ALL_PLUGS.map((p) => p.domain))];

    const filtered = ALL_PLUGS.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.domain.toLowerCase().includes(search.toLowerCase());
        const matchesDomain =
            selectedDomain === "all" || p.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    });

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
                    Marketplace
                </h1>
                <p className="font-mono text-sm text-text-muted">
                    Browse and purchase SME expert plugins
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-8">
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
                        {domains.map((d) => (
                            <option key={d} value={d} className="bg-canvas">
                                {d === "all" ? "All Domains" : d}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((plug, i) => (
                    <motion.div
                        key={plug.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-surface border border-border rounded-lg p-6 hover:border-border-hover transition-all group cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                style={{ background: plug.bg, border: `1px solid ${plug.border}` }}
                            >
                                {plug.icon}
                            </div>
                            <div className="font-mono text-lg font-bold text-lime">
                                {plug.score.toFixed(2)}
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
                            {plug.tags.slice(0, 3).map((t) => (
                                <span
                                    key={t}
                                    className="font-mono text-[10px] bg-canvas border border-border text-text-muted px-1.5 py-0.5 rounded-[3px]"
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-border">
                            <div>
                                <span className="font-mono text-xl font-bold text-text-primary">
                                    ${plug.price}
                                </span>
                                <span className="font-mono text-[11px] text-text-faint">
                                    /mo
                                </span>
                            </div>
                            <button
                                className="font-mono text-[11px] font-bold tracking-[0.05em] px-4 py-2 cursor-pointer transition-all border"
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
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
