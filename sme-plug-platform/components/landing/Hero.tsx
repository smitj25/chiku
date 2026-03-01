"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import TerminalSnippet from "./TerminalSnippet";
import { IDE_LOGOS } from "@/lib/data";

function CitationBadge({ text }: { text: string }) {
    return (
        <span className="inline-flex items-center gap-1 bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] text-plug-engineering rounded-[3px] px-2 py-0.5 text-[11px] font-mono">
            📎 {text}
        </span>
    );
}

export default function Hero() {
    return (
        <section className="min-h-[calc(100vh-4rem)] flex items-center px-6 md:px-20 pt-28 pb-20 relative overflow-hidden border-b border-border">
            {/* BG Glow */}
            <div
                className="absolute pointer-events-none"
                style={{
                    top: "18%",
                    left: "52%",
                    width: "720px",
                    height: "720px",
                    background:
                        "radial-gradient(circle, rgba(163,230,53,0.08) 0%, transparent 72%)",
                }}
            />

            <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Left: Copy */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 border border-[rgba(163,230,53,0.3)] bg-[rgba(163,230,53,0.05)] px-3.5 py-1.5 mb-8 font-mono text-[11px] text-lime tracking-[0.1em]">
                        <div className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse-lime" />
                        B2B ENTERPRISE · DEVELOPER PLATFORM
                    </div>

                    <h1 className="ui-page-title text-[clamp(42px,5vw,68px)] mb-6">
                        The AI Expert
                        <br />
                        That{" "}
                        <span className="text-lime">Cites Its Sources</span>
                    </h1>

                    <p className="font-mono text-[15px] text-text-muted ui-copy max-w-[56ch] mb-10">
                        Hot-swappable AI expert plugins for enterprise. Legal, Healthcare,
                        Engineering. Every claim verified. Every fact cited. Zero
                        hallucinations. Import to VS Code, Cursor, or any codebase in 60
                        seconds.
                    </p>

                    <div className="flex gap-4 flex-wrap">
                        <Link
                            href="/register"
                            className="bg-lime text-canvas font-mono font-bold text-sm tracking-[0.06em] px-7 py-3.5 hover:opacity-85 transition-opacity no-underline inline-block"
                        >
                            START FOR FREE →
                        </Link>
                        <a
                            href="#marketplace"
                            className="bg-transparent border border-border-hover text-text-muted font-mono text-sm tracking-[0.06em] px-7 py-3.5 hover:border-[rgba(255,255,255,0.4)] transition-colors no-underline inline-block"
                        >
                            VIEW DEMO
                        </a>
                    </div>

                    {/* Trust strip */}
                    <div className="mt-12">
                        <div className="font-mono text-[11px] text-text-ghost tracking-[0.1em] mb-3">
                            WORKS WITH
                        </div>
                        <div className="flex gap-5 flex-wrap">
                            {IDE_LOGOS.map((logo) => (
                                <span
                                    key={logo}
                                    className="font-mono text-xs text-text-faint border-b border-border pb-0.5"
                                >
                                    {logo}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Right: Terminal */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <TerminalSnippet />

                    {/* Sample Response */}
                    <div className="mt-5 bg-surface border border-border rounded-lg p-4 font-mono text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
                        <div className="text-text-faint mb-2.5 text-[11px] tracking-[0.05em]">
                            → RESPONSE
                        </div>
                        <div className="text-[rgba(255,255,255,0.7)] leading-[1.6] mb-2.5">
                            Clause 4.2 creates unlimited liability exposure under GDPR Article
                            83(5)...
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <CitationBadge text="GDPR Art.83, pg 47" />
                            <CitationBadge text="Contract_v3.pdf, pg 12" />
                            <span className="inline-flex items-center gap-1 bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.3)] text-plug-healthcare rounded-[3px] px-2 py-0.5 text-[11px] font-mono">
                                ✓ Verified
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
