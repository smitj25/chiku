"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PLUGS } from "@/lib/data";

type Plug = (typeof PLUGS)[number];

function PlugCard({ plug, index }: { plug: Plug; index: number }) {
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="rounded-lg p-7 cursor-default transition-all duration-300"
            style={{
                background: hovered ? plug.bg : "rgba(255,255,255,0.02)",
                border: `1px solid ${hovered ? plug.border : "rgba(255,255,255,0.06)"}`,
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-xl"
                    style={{
                        background: plug.bg,
                        border: `1px solid ${plug.border}`,
                    }}
                >
                    {plug.icon}
                </div>
                <div className="text-right">
                    <div className="font-mono text-[11px] text-text-faint mb-0.5">
                        RAGAS Score
                    </div>
                    <div className="font-mono text-xl font-bold text-lime">
                        {plug.score.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Domain */}
            <div className="mb-1.5">
                <span
                    className="font-mono text-[11px] tracking-[0.1em] uppercase"
                    style={{ color: plug.color }}
                >
                    {plug.domain}
                </span>
            </div>

            {/* Name */}
            <div className="text-xl font-bold text-text-primary mb-3 tracking-[-0.02em] font-display">
                {plug.name}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
                {plug.tags.map((tag) => (
                    <span
                        key={tag}
                        className="font-mono text-[10px] bg-surface border border-border text-text-muted px-2 py-0.5 rounded-[3px]"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* Example query */}
            <div
                className="rounded-md p-3 font-mono text-xs text-text-muted mb-5 italic leading-[1.5]"
                style={{
                    background: "rgba(0,0,0,0.3)",
                    borderLeft: `2px solid ${plug.color}`,
                }}
            >
                &quot;{plug.example}&quot;
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
                <div>
                    <span className="font-mono text-[22px] font-bold text-text-primary">
                        ${plug.price}
                    </span>
                    <span className="font-mono text-xs text-text-faint">/plug/mo</span>
                </div>
                <button
                    className="font-mono text-xs font-bold tracking-[0.05em] px-4 py-2 cursor-pointer transition-all duration-200"
                    style={{
                        background: hovered ? plug.color : "transparent",
                        border: `1px solid ${plug.color}`,
                        color: hovered ? "#0a0a0f" : plug.color,
                    }}
                >
                    BUY PLUG →
                </button>
            </div>
        </motion.div>
    );
}

export default function PlugShowcase() {
    return (
        <section
            id="marketplace"
            className="py-20 md:py-24 px-6 md:px-20 bg-surface border-t border-[rgba(255,255,255,0.04)]"
        >
            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                    <div>
                        <div className="font-mono text-[11px] text-lime tracking-[0.15em] mb-3">
                            SME PLUG MARKETPLACE
                        </div>
                        <h2 className="font-display text-4xl md:text-[42px] font-bold text-text-primary tracking-[-0.02em]">
                            Choose your expert
                        </h2>
                    </div>
                    <a
                        href="/marketplace"
                        className="font-mono text-xs text-lime tracking-[0.05em] no-underline border-b border-[rgba(163,230,53,0.3)] pb-0.5 hover:border-lime transition-colors"
                    >
                        VIEW ALL PLUGS →
                    </a>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLUGS.map((plug, i) => (
                        <PlugCard key={plug.id} plug={plug} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
