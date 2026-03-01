"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CTASection() {
    return (
        <section className="py-24 px-6 md:px-20 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-[900px] mx-auto rounded-2xl border border-[rgba(163,230,53,0.15)] bg-[linear-gradient(180deg,rgba(163,230,53,0.07),rgba(163,230,53,0.02))] px-6 py-14 md:px-14 md:py-16"
            >
                <h2 className="ui-page-title text-4xl md:text-[52px] mb-5">
                    Ready to deploy
                    <br />
                    <span className="text-lime">trusted AI?</span>
                </h2>
                <p className="ui-page-subtitle mx-auto mb-10">
                    Join enterprises using Tether to eliminate hallucination risk.
                    <br />
                    Up and running in 60 seconds. No credit card required.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                    <Link
                        href="/register"
                        className="bg-lime text-canvas font-mono font-bold text-[15px] tracking-[0.06em] px-9 py-4 hover:opacity-85 transition-opacity no-underline"
                    >
                        GET STARTED FREE →
                    </Link>
                    <Link
                        href="/#marketplace"
                        className="bg-transparent border border-border-hover text-[rgba(255,255,255,0.6)] font-mono text-[15px] tracking-[0.06em] px-9 py-4 hover:border-[rgba(255,255,255,0.3)] transition-colors no-underline"
                    >
                        BROWSE PLUGS
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}
