"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export default function SettingsPage() {
    const [companyName, setCompanyName] = useState("Acme Corp");
    const [email, setEmail] = useState("admin@acme.com");

    return (
        <div>
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-text-primary mb-2">Settings</h1>
                <p className="font-mono text-sm text-text-muted">Account and organization settings</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="font-mono text-[10px] text-text-faint tracking-[0.1em] mb-4">ORGANIZATION</div>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-mono text-[10px] text-text-faint tracking-[0.1em] mb-2">COMPANY NAME</label>
                            <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-canvas border border-border rounded-md px-4 py-3 font-mono text-sm text-text-primary outline-none focus:border-lime transition-colors" />
                        </div>
                        <div>
                            <label className="block font-mono text-[10px] text-text-faint tracking-[0.1em] mb-2">EMAIL</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-canvas border border-border rounded-md px-4 py-3 font-mono text-sm text-text-primary outline-none focus:border-lime transition-colors" />
                        </div>
                    </div>
                    <button className="mt-4 flex items-center gap-2 bg-lime text-canvas font-mono font-bold text-xs tracking-[0.06em] px-5 py-2.5 hover:opacity-90 transition-opacity cursor-pointer border-none rounded-md">
                        <Save size={14} /> SAVE CHANGES
                    </button>
                </div>

                <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="font-mono text-[10px] text-text-faint tracking-[0.1em] mb-4">DANGER ZONE</div>
                    <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-md p-4 flex items-center justify-between">
                        <div>
                            <div className="font-mono text-sm text-text-primary">Delete organization</div>
                            <div className="font-mono text-[11px] text-text-ghost">This will permanently delete all data</div>
                        </div>
                        <button className="font-mono text-xs text-red-stat border border-[rgba(239,68,68,0.3)] rounded-md px-4 py-2 hover:bg-[rgba(239,68,68,0.1)] transition-all cursor-pointer bg-transparent">DELETE</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
