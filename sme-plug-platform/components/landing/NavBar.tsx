"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NavBar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 md:px-10 transition-all duration-300 ${scrolled
                    ? "bg-[rgba(8,8,12,0.95)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]"
                    : "bg-transparent border-b border-transparent"
                }`}
        >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 no-underline">
                <div
                    className="w-7 h-7"
                    style={{
                        background: "linear-gradient(135deg, #a3e635, #65a30d)",
                        clipPath:
                            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    }}
                />
                <span className="font-mono font-bold text-lg text-text-primary tracking-tight">
                    sme<span className="text-lime">plug</span>
                </span>
            </Link>

            {/* Links */}
            <div className="flex items-center gap-4 md:gap-8">
                {["Docs", "Pricing", "Marketplace"].map((item) => (
                    <a
                        key={item}
                        href={`#${item.toLowerCase()}`}
                        className="hidden md:block font-mono text-[13px] text-text-faint tracking-wider hover:text-text-primary transition-colors no-underline"
                    >
                        {item}
                    </a>
                ))}
                <Link
                    href="/login"
                    className="font-mono text-[13px] text-text-faint tracking-wider hover:text-text-primary transition-colors no-underline"
                >
                    Login
                </Link>
                <Link
                    href="/register"
                    className="font-mono text-[13px] bg-lime text-canvas font-bold tracking-wider px-4 py-2 hover:opacity-85 transition-opacity no-underline"
                >
                    GET STARTED →
                </Link>
            </div>
        </nav>
    );
}
