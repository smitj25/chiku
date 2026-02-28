"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Book, Code, Terminal, Key, ArrowLeft } from "lucide-react";

const SECTIONS = [
    { icon: Book, title: "Getting Started", desc: "Install the SDK, get your API key, and make your first query in under 60 seconds.", href: "#quickstart" },
    { icon: Code, title: "SDK Reference", desc: "Full API reference for the npm and pip packages. TypeScript and Python.", href: "#sdk" },
    { icon: Terminal, title: "REST API", desc: "Direct HTTP access for any language or platform. OpenAPI spec available.", href: "#rest" },
    { icon: Key, title: "Authentication", desc: "How API keys work, scoping, environments, and security best practices.", href: "#auth" },
];

export default function DocsPage() {
    return (
        <main className="min-h-screen bg-canvas">
            <nav className="sticky top-0 z-50 bg-[rgba(8,8,12,0.9)] backdrop-blur-xl border-b border-border">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 no-underline">
                        <div className="w-6 h-6" style={{ background: "linear-gradient(135deg,#a3e635,#65a30d)", clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" }} />
                        <span className="font-mono font-bold text-base text-text-primary tracking-tight">sme<span className="text-lime">plug</span></span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/pricing" className="font-mono text-[13px] text-text-muted no-underline hover:text-text-primary">Pricing</Link>
                        <Link href="/login" className="font-mono text-[13px] text-text-muted no-underline hover:text-text-primary">Login</Link>
                        <Link href="/register" className="font-mono text-[11px] font-bold tracking-[0.08em] bg-lime text-canvas px-4 py-2 no-underline hover:opacity-90">GET STARTED →</Link>
                    </div>
                </div>
            </nav>

            <section className="max-w-4xl mx-auto px-6 pt-20 pb-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="font-mono text-[11px] text-lime tracking-[0.15em] mb-4">DOCUMENTATION</div>
                    <h1 className="font-display text-5xl font-bold text-text-primary mb-4">Build with SME-Plug</h1>
                    <p className="font-mono text-base text-text-muted max-w-xl">Everything you need to integrate verified AI experts into your codebase.</p>
                </motion.div>
            </section>

            <section className="max-w-4xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SECTIONS.map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-surface border border-border rounded-lg p-6 hover:border-lime transition-all cursor-pointer group">
                            <s.icon size={20} className="text-lime mb-3" />
                            <div className="font-display text-lg font-bold text-text-primary mb-1 group-hover:text-lime transition-colors">{s.title}</div>
                            <div className="font-mono text-xs text-text-muted leading-[1.7]">{s.desc}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Quickstart */}
            <section id="quickstart" className="max-w-4xl mx-auto px-6 pb-12">
                <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Quick Start</h2>
                <div className="space-y-4">
                    {[
                        { step: "1", title: "Install the SDK", code: "npm install @smeplug/sdk" },
                        { step: "2", title: "Initialize with your API key", code: "import { SMEPlug } from '@smeplug/sdk'\n\nconst plug = new SMEPlug({\n  apiKey: process.env.SME_API_KEY,\n  pluginId: 'legal-v1'\n})" },
                        { step: "3", title: "Make your first query", code: "const response = await plug.chat('Analyze clause 4.2 for liability.')\n\nconsole.log(response.text)       // Cited analysis\nconsole.log(response.citations)  // [{ source, page }]\nconsole.log(response.verified)   // true" },
                    ].map((item) => (
                        <div key={item.step} className="bg-surface border border-border rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="font-mono text-xs text-lime font-bold bg-[rgba(163,230,53,0.1)] border border-[rgba(163,230,53,0.2)] w-6 h-6 rounded-full flex items-center justify-center">{item.step}</span>
                                <span className="font-mono text-sm font-semibold text-text-primary">{item.title}</span>
                            </div>
                            <pre className="bg-canvas border border-border rounded-md p-4 font-mono text-xs text-text-secondary leading-[1.8] overflow-x-auto">{item.code}</pre>
                        </div>
                    ))}
                </div>
            </section>

            {/* REST API */}
            <section id="rest" className="max-w-4xl mx-auto px-6 pb-12">
                <h2 className="font-display text-2xl font-bold text-text-primary mb-6">REST API</h2>
                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="font-mono text-sm text-text-primary font-semibold mb-3">POST /v1/chat</div>
                    <pre className="bg-canvas border border-border rounded-md p-4 font-mono text-xs text-text-secondary leading-[1.8] overflow-x-auto">{`curl -X POST https://api.smeplug.dev/v1/chat \\
  -H "Authorization: Bearer sme_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What are the GDPR penalties?",
    "session_id": "optional-session-id"
  }'`}</pre>
                </div>
            </section>

            {/* Auth */}
            <section id="auth" className="max-w-4xl mx-auto px-6 pb-20">
                <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Authentication</h2>
                <div className="space-y-4">
                    <div className="bg-surface border border-border rounded-lg p-6">
                        <div className="font-mono text-sm font-semibold text-text-primary mb-2">API Key Format</div>
                        <div className="font-mono text-xs text-text-muted leading-[1.7] mb-3">Keys are prefixed by environment:</div>
                        <div className="space-y-1">
                            <div className="font-mono text-xs"><span className="text-lime">sme_live_</span><span className="text-text-ghost">xxxx</span> — Production</div>
                            <div className="font-mono text-xs"><span className="text-plug-engineering">sme_test_</span><span className="text-text-ghost">xxxx</span> — Development/testing</div>
                        </div>
                    </div>
                    <div className="bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.2)] rounded-lg p-6">
                        <div className="font-mono text-[10px] text-plug-engineering tracking-[0.1em] mb-2">⚠ SECURITY BEST PRACTICES</div>
                        <ul className="font-mono text-xs text-text-muted leading-[1.8] list-disc pl-4 space-y-1">
                            <li>Never commit API keys to source control</li>
                            <li>Use environment variables (e.g., <code className="text-text-primary">SME_API_KEY</code>)</li>
                            <li>Rotate keys periodically via the dashboard</li>
                            <li>Use <code className="text-text-primary">sme_test_</code> keys for development</li>
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
}
