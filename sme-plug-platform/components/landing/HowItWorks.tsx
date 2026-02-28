"use client";

import { motion } from "framer-motion";
import { STEPS } from "@/lib/data";

export default function HowItWorks() {
    return (
        <section className="py-24 px-6 md:px-20">
            <div className="max-w-[1200px] mx-auto">
                <div className="text-center mb-16">
                    <div className="font-mono text-[11px] text-lime tracking-[0.15em] mb-4">
                        HOW IT WORKS
                    </div>
                    <h2 className="font-display text-4xl md:text-[42px] font-bold text-text-primary tracking-[-0.02em]">
                        Three steps to trusted AI
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="relative p-8"
                        >
                            {/* Arrow connector */}
                            {i < STEPS.length - 1 && (
                                <div className="hidden md:block absolute top-11 -right-5 w-10 h-px bg-[rgba(163,230,53,0.3)]">
                                    <div
                                        className="absolute right-0 -top-1"
                                        style={{
                                            width: 0,
                                            height: 0,
                                            borderLeft: "6px solid rgba(163,230,53,0.5)",
                                            borderTop: "4px solid transparent",
                                            borderBottom: "4px solid transparent",
                                        }}
                                    />
                                </div>
                            )}

                            <div className="font-mono text-[52px] font-bold text-text-ghost leading-none mb-4 tracking-[-0.04em]">
                                {step.step}
                            </div>
                            <div className="font-display text-[22px] font-bold text-text-primary mb-3 tracking-[-0.01em]">
                                {step.title}
                            </div>
                            <div className="font-mono text-[13px] text-text-muted leading-[1.6]">
                                {step.desc}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
