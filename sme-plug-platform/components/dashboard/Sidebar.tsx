"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Store,
    Puzzle,
    Key,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    FileText,
    GitCompareArrows,
} from "lucide-react";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/compare", label: "Compare", icon: GitCompareArrows },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/plugins", label: "My Plugins", icon: Puzzle },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/api-keys", label: "API Keys", icon: Key },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-surface border border-border rounded-lg p-2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
                <Menu size={20} />
            </button>

            {/* Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:relative top-0 left-0 h-screen w-64 bg-canvas border-r border-border flex flex-col z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                    <Link href="/" className="flex items-center gap-2.5 no-underline">
                        <div
                            className="w-7 h-7"
                            style={{
                                background: "linear-gradient(135deg, #a3e635, #65a30d)",
                                clipPath:
                                    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            }}
                        />
                        <span className="font-mono font-bold text-base text-text-primary tracking-tight">
                            sme<span className="text-lime">plug</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden text-text-faint hover:text-text-primary cursor-pointer bg-transparent border-none"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm no-underline transition-all ${isActive
                                    ? "bg-[rgba(163,230,53,0.08)] text-lime border border-[rgba(163,230,53,0.2)]"
                                    : "text-text-muted hover:text-text-primary hover:bg-surface border border-transparent"
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="px-3 py-5 border-t border-border">
                    <div className="flex items-center gap-3 px-4 py-2.5 mb-2">
                        <div className="w-9 h-9 rounded-full bg-[rgba(163,230,53,0.15)] flex items-center justify-center font-mono text-xs text-lime font-bold">
                            AC
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs text-text-primary truncate">
                                admin@acme.com
                            </div>
                            <div className="font-mono text-[11px] text-text-ghost">
                                Acme Corp
                            </div>
                        </div>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm text-text-faint hover:text-red-stat hover:bg-[rgba(239,68,68,0.05)] transition-all cursor-pointer bg-transparent border-none">
                        <LogOut size={16} />
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    );
}
