"use client";

import { motion } from "framer-motion";
import { STATS } from "@/lib/data";

export default function StatsBar() {
    return (
        <section className="border-b border-border py-16 px-6 md:px-20 bg-canvas-subtle">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
                {STATS.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 }}
                        className="rounded-lg border border-border bg-surface p-6"
                    >
                        <div className="font-display text-5xl font-bold text-red-stat leading-none mb-2">
                            {stat.value}
                        </div>
                        <div className="font-mono text-[13px] text-text-muted leading-[1.5] mb-2">
                            {stat.label}
                        </div>
                        <div className="font-mono text-[10px] text-text-ghost tracking-[0.1em]">
                            SOURCE: {stat.source}
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
