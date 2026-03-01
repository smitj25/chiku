import Link from "next/link";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border px-6 md:px-20 py-10 flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 no-underline">
                <div
                    className="w-5 h-5"
                    style={{
                        background: "linear-gradient(135deg, #a3e635, #65a30d)",
                        clipPath:
                            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    }}
                />
                <span className="font-mono text-sm font-bold text-text-primary">
                    te<span className="text-lime">ther</span>
                </span>
            </Link>

            {/* Links */}
            <div className="flex gap-6 flex-wrap justify-center">
                {[
                    { label: "Docs", href: "/docs" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Marketplace", href: "/#marketplace" },
                    { label: "Login", href: "/login" },
                    { label: "Get Started", href: "/register" },
                ].map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="font-mono text-xs text-text-faint tracking-[0.05em] no-underline hover:text-text-muted transition-colors"
                    >
                        {item.label}
                    </Link>
                ))}
            </div>

            {/* Copyright */}
            <div className="font-mono text-[11px] text-text-ghost">
                © {year} Tether Inc. All rights reserved.
            </div>
        </footer>
    );
}
