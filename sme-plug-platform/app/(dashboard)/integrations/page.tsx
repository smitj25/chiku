"use client";

import { useState, useEffect, useRef } from "react";
import {
    Database, RefreshCw, Box, ShoppingCart,
    ToggleLeft, ToggleRight, Zap, Bot, ArrowRight,
    MessageSquare, SplitIcon, Building2, Stethoscope, Scale, Server
} from "lucide-react";
import { backendUrl } from "@/lib/public-runtime";

// --- FALLBACK DATA ---
const FALLBACK_DB: any = {
    buildco: {
        name: "BuildCo Construction",
        plugId: "engineering",
        kpis: { total: "$4.2M", pos: 14, alerts: 2 },
        materials: [
            { id: "MAT-8992", name: "Type II Steel Rebar", stock: 450, unit: "Tons", status: "Healthy" },
            { id: "MAT-8993", name: "Portland Cement v2", stock: 12, unit: "Pallets", status: "Critical" },
            { id: "MAT-8994", name: "Structural Timber", stock: 880, unit: "Boards", status: "Healthy" }
        ],
        pos: [
            { id: "PO-2026-881", vendor: "Global Steel LLC", amount: "$145,000", delivery: "Oct 12, 2026", status: "In Transit" },
            { id: "PO-2026-882", vendor: "CementCo Inc", amount: "$22,000", delivery: "Oct 15, 2026", status: "Processing" }
        ],
        sampleQ: "Are there any material shortages that could delay the new high-rise project?"
    },
    hospital: {
        name: "City General Hospital",
        plugId: "healthcare",
        kpis: { total: "$1.8M", pos: 42, alerts: 1 },
        materials: [
            { id: "MED-110", name: "Surgical Masks (N95)", stock: 5000, unit: "Boxes", status: "Healthy" },
            { id: "MED-111", name: "IV Saline Bags 500ml", stock: 45, unit: "Units", status: "Critical" },
            { id: "MED-112", name: "Sterile Gauze Pads", stock: 1200, unit: "Packs", status: "Healthy" }
        ],
        pos: [
            { id: "PO-MED-991", vendor: "PharmaSupply+", amount: "$45,200", delivery: "Oct 10, 2026", status: "In Transit" }
        ],
        sampleQ: "Checking inventory levels for IV saline bags. Do we need to order more before the weekend?"
    },
    lawfirm: {
        name: "Pearson Specter Litt",
        plugId: "legal",
        kpis: { total: "$45K", pos: 3, alerts: 0 },
        materials: [
            { id: "OFF-001", name: "Legal Pad Boxes (Yellow)", stock: 120, unit: "Boxes", status: "Healthy" },
            { id: "OFF-002", name: "Printer Toner 89X", stock: 15, unit: "Cartridges", status: "Healthy" }
        ],
        pos: [
            { id: "PO-LEG-101", vendor: "Office Depot Corp", amount: "$1,200", delivery: "Oct 14, 2026", status: "Processing" }
        ],
        sampleQ: "What is the status of our printer toner supply?"
    }
};

export default function IntegrationsPage() {
    const [activeTab, setActiveTab] = useState<"erp" | "chat" | "compare">("erp");
    const [tenantId, setTenantId] = useState<"buildco" | "hospital" | "lawfirm">("buildco");
    const [syncing, setSyncing] = useState(false);

    // ERP Data State
    const [erpData, setErpData] = useState(FALLBACK_DB.buildco);

    // Chat State
    const [sapEnabled, setSapEnabled] = useState(true);
    const [chatInput, setChatInput] = useState("");
    const [chatLog, setChatLog] = useState<{ role: string, content: string, injected?: boolean }[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Compare State
    const [compareInput, setCompareInput] = useState("");
    const [compareResults, setCompareResults] = useState<{ raw: string, sap: string } | null>(null);
    const [isCompareLoading, setIsCompareLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatLog]);

    // Fetch live SAP data (or fallback)
    const fetchSapData = async (tenant: string) => {
        setSyncing(true);
        try {
            const [matRes, poRes, kpiRes] = await Promise.all([
                fetch(`${backendUrl("/integrations/materials")}?tenant_id=${tenant}`),
                fetch(`${backendUrl("/integrations/pos")}?tenant_id=${tenant}`),
                fetch(`${backendUrl("/integrations/kpis")}?tenant_id=${tenant}`)
            ]);

            if (matRes.ok && poRes.ok && kpiRes.ok) {
                const materials = await matRes.json();
                const pos = await poRes.json();
                const kpis = await kpiRes.json();
                setErpData({
                    ...FALLBACK_DB[tenant as keyof typeof FALLBACK_DB],
                    materials: materials.materials,
                    pos: pos.pos,
                    kpis: kpis.kpis,
                    name: kpis.tenant_name
                });
            } else {
                setErpData(FALLBACK_DB[tenant as keyof typeof FALLBACK_DB]);
            }
        } catch {
            setErpData(FALLBACK_DB[tenant as keyof typeof FALLBACK_DB]);
        }
        setTimeout(() => setSyncing(false), 800);
    };

    useEffect(() => {
        fetchSapData(tenantId);
        setChatInput(FALLBACK_DB[tenantId].sampleQ);
        setCompareInput(FALLBACK_DB[tenantId].sampleQ);
        setChatLog([]);
        setCompareResults(null);
    }, [tenantId]);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput;
        setChatLog(prev => [...prev, { role: "user", content: userMsg }]);
        setChatInput("");
        setIsChatLoading(true);

        try {
            const res = await fetch(backendUrl("/chat"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    plug_id: FALLBACK_DB[tenantId].plugId,
                    mode: "sme",
                    use_sap: sapEnabled,
                    sap_tenant_id: tenantId
                })
            });
            const data = await res.json();
            setChatLog(prev => [...prev, { role: "assistant", content: data.response, injected: sapEnabled }]);
        } catch (err) {
            setChatLog(prev => [...prev, { role: "assistant", content: "Error connecting to AI." }]);
        }
        setIsChatLoading(false);
    };

    const handleCompare = async () => {
        if (!compareInput.trim() || isCompareLoading) return;
        setIsCompareLoading(true);
        setCompareResults(null);

        try {
            // Run exactly the same query with and without SAP flag
            const [rawRes, sapRes] = await Promise.all([
                fetch(backendUrl("/chat"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: compareInput,
                        plug_id: FALLBACK_DB[tenantId].plugId,
                        mode: "baseline",
                        use_sap: false,
                        sap_tenant_id: tenantId
                    })
                }),
                fetch(backendUrl("/chat"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: compareInput,
                        plug_id: FALLBACK_DB[tenantId].plugId,
                        mode: "sme",
                        use_sap: true,
                        sap_tenant_id: tenantId
                    })
                })
            ]);

            const rawData = await rawRes.json();
            const sapData = await sapRes.json();

            setCompareResults({
                raw: rawData.response,
                sap: sapData.response
            });
        } catch (err) {
            setCompareResults({ raw: "Error", sap: "Error" });
        }
        setIsCompareLoading(false);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)] w-full bg-canvas text-text-primary gap-6 font-mono">
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Database className="text-lime" />
                        Enterprise Integrations
                    </h1>
                    <p className="text-text-muted mt-1">Live SAP S/4HANA ERP Connector Demo</p>
                </div>

                {/* Tenant Switcher */}
                <div className="flex bg-surface border border-border rounded-lg p-1">
                    <button
                        onClick={() => setTenantId("buildco")}
                        className={`px-4 py-2 text-sm rounded flex items-center gap-2 cursor-pointer transition-colors ${tenantId === "buildco" ? "bg-border text-white" : "text-text-muted hover:text-white border-transparent"}`}
                    >
                        <Building2 size={16} /> BuildCo
                    </button>
                    <button
                        onClick={() => setTenantId("hospital")}
                        className={`px-4 py-2 text-sm rounded flex items-center gap-2 cursor-pointer transition-colors ${tenantId === "hospital" ? "bg-border text-white" : "text-text-muted hover:text-white border-transparent"}`}
                    >
                        <Stethoscope size={16} /> Hospital
                    </button>
                    <button
                        onClick={() => setTenantId("lawfirm")}
                        className={`px-4 py-2 text-sm rounded flex items-center gap-2 cursor-pointer transition-colors ${tenantId === "lawfirm" ? "bg-border text-white" : "text-text-muted hover:text-white border-transparent"}`}
                    >
                        <Scale size={16} /> Law Firm
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="section-card-subtle p-2 flex gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("erp")}
                    className={`px-6 py-3 font-semibold text-sm cursor-pointer border rounded-md flex items-center gap-2 whitespace-nowrap ${activeTab === "erp" ? "border-lime text-lime bg-[rgba(163,230,53,0.06)]" : "border-transparent text-text-muted hover:text-white"}`}
                >
                    <Server size={18} /> Live ERP Data
                </button>
                <button
                    onClick={() => setActiveTab("chat")}
                    className={`px-6 py-3 font-semibold text-sm cursor-pointer border rounded-md flex items-center gap-2 whitespace-nowrap ${activeTab === "chat" ? "border-lime text-lime bg-[rgba(163,230,53,0.06)]" : "border-transparent text-text-muted hover:text-white"}`}
                >
                    <MessageSquare size={18} /> AI + SAP Chat
                </button>
                <button
                    onClick={() => setActiveTab("compare")}
                    className={`px-6 py-3 font-semibold text-sm cursor-pointer border rounded-md flex items-center gap-2 whitespace-nowrap ${activeTab === "compare" ? "border-lime text-lime bg-[rgba(163,230,53,0.06)]" : "border-transparent text-text-muted hover:text-white"}`}
                >
                    <SplitIcon size={18} /> Without vs With SAP
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-[560px]">

                {/* TAB 1: ERP DATA */}
                {activeTab === "erp" && (
                    <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Database className="text-emerald-400" size={24} />
                                SAP Data Source: {erpData.name}
                            </h2>
                            <button
                                onClick={() => fetchSapData(tenantId)}
                                className="flex items-center gap-2 bg-surface hover:bg-border text-text-primary px-4 py-2 rounded border border-border cursor-pointer transition-colors"
                            >
                                <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                                Sync Now
                            </button>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="text-text-muted text-sm mb-1 line-clamp-1">Total Inventory Value</div>
                                <div className="text-2xl font-bold text-white">{erpData.kpis.total}</div>
                            </div>
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="text-text-muted text-sm mb-1 line-clamp-1">Open Purchase Orders</div>
                                <div className="text-2xl font-bold text-white">{erpData.kpis.pos}</div>
                            </div>
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="text-text-muted text-sm mb-1 line-clamp-1">Stock Alerts</div>
                                <div className={`text-2xl font-bold ${erpData.kpis.alerts > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                    {erpData.kpis.alerts}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Materials */}
                            <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)] flex items-center gap-2">
                                    <Box size={18} className="text-blue-400" />
                                    <h3 className="font-bold">Materials Inventory</h3>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-text-muted">
                                                <th className="px-4 py-3 text-left font-medium">Material ID</th>
                                                <th className="px-4 py-3 text-left font-medium">Name</th>
                                                <th className="px-4 py-3 text-right font-medium">Stock</th>
                                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {erpData.materials.map((m: any, i: number) => (
                                                <tr key={i} className="border-b border-border/50 hover:bg-border/30">
                                                    <td className="px-4 py-3 text-text-faint">{m.id}</td>
                                                    <td className="px-4 py-3 text-white">{m.name}</td>
                                                    <td className="px-4 py-3 text-right text-text-faint">{m.stock} {m.unit}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-xs ${m.status === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                            {m.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* POs */}
                            <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-border bg-[rgba(255,255,255,0.02)] flex items-center gap-2">
                                    <ShoppingCart size={18} className="text-purple-400" />
                                    <h3 className="font-bold">Open Purchase Orders</h3>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-text-muted">
                                                <th className="px-4 py-3 text-left font-medium">PO Number</th>
                                                <th className="px-4 py-3 text-left font-medium">Vendor</th>
                                                <th className="px-4 py-3 text-left font-medium">Amount</th>
                                                <th className="px-4 py-3 text-left font-medium">Delivery</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {erpData.pos.map((p: any, i: number) => (
                                                <tr key={i} className="border-b border-border/50 hover:bg-border/30">
                                                    <td className="px-4 py-3 text-text-faint">{p.id}</td>
                                                    <td className="px-4 py-3 text-white">{p.vendor}</td>
                                                    <td className="px-4 py-3 text-text-faint">{p.amount}</td>
                                                    <td className="px-4 py-3 text-text-muted">{p.delivery}</td>
                                                </tr>
                                            ))}
                                            {erpData.pos.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">No open purchase orders.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: AI + SAP CHAT */}
                {activeTab === "chat" && (
                    <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-[rgba(255,255,255,0.02)]">
                            <div className="flex items-center gap-3">
                                <Bot size={20} className="text-lime" />
                                <h3 className="font-bold">AI Augmented by SAP</h3>
                            </div>
                            <button
                                onClick={() => setSapEnabled(!sapEnabled)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${sapEnabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-surface border-border text-text-muted"}`}
                            >
                                {sapEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                SAP Context: {sapEnabled ? "ENABLED" : "DISABLED"}
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {chatLog.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto h-full text-text-muted">
                                    <Database size={48} className="mb-4 opacity-50" />
                                    <h3 className="text-lg text-white mb-2">Test the Connector</h3>
                                    <p className="text-sm mb-6">Ask a question about {erpData.name}'s inventory or purchase orders. The AI will query the live SAP database to answer.</p>
                                    <button
                                        onClick={() => handleChatSubmit({ preventDefault: () => { } } as any)}
                                        className="text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-emerald-400/20"
                                    >
                                        Try: "{FALLBACK_DB[tenantId].sampleQ}"
                                    </button>
                                </div>
                            ) : (
                                chatLog.map((msg, i) => (
                                    <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                        <div className={`max-w-[80%] rounded-xl p-4 ${msg.role === "user"
                                            ? "bg-border text-white"
                                            : msg.injected
                                                ? "bg-[rgba(16,185,129,0.1)] border-l-4 border-emerald-500 text-text-primary"
                                                : "bg-surface border border-border text-text-primary"
                                            }`}>
                                            {msg.role === "assistant" && msg.injected && (
                                                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-2 tracking-wider">
                                                    <Zap size={14} /> SAP ERP DATA INJECTED
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isChatLoading && (
                                <div className="flex items-start">
                                    <div className="bg-surface border border-border rounded-xl p-4 text-text-muted flex items-center gap-2 animate-pulse">
                                        <Bot size={18} /> Processing...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleChatSubmit} className="p-4 border-t border-border bg-canvas">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Ask about materials or POs..."
                                    className="w-full bg-surface border border-border rounded-lg pl-4 pr-12 py-3 text-white placeholder-text-muted focus:outline-none focus:border-lime transition-colors"
                                    disabled={isChatLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isChatLoading}
                                    className="absolute right-2 top-2 bottom-2 aspect-square bg-lime text-black rounded flex items-center justify-center disabled:opacity-50 cursor-pointer"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 3: WITHOUT VS WITH SAP */}
                {activeTab === "compare" && (
                    <div className="flex flex-col h-full gap-4">
                        {/* Input Area */}
                        <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-4">
                            <input
                                type="text"
                                value={compareInput}
                                onChange={(e) => setCompareInput(e.target.value)}
                                className="flex-1 bg-canvas border border-border rounded pl-4 py-2 text-white focus:outline-none focus:border-lime"
                            />
                            <button
                                onClick={handleCompare}
                                disabled={!compareInput.trim() || isCompareLoading}
                                className="bg-lime text-black font-bold px-6 py-2 rounded cursor-pointer disabled:opacity-50 hover:bg-lime/90 flex items-center gap-2"
                            >
                                {isCompareLoading ? <RefreshCw className="animate-spin" size={18} /> : <SplitIcon size={18} />}
                                Compare Results
                            </button>
                        </div>

                        {/* Results Split View */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                            {/* Left: Without SAP */}
                            <div className="flex flex-col bg-surface border border-border rounded-xl overflow-hidden h-full">
                                <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-red-400 font-bold">
                                    <Bot size={18} />
                                    Baseline AI (No Context)
                                </div>
                                <div className="p-5 overflow-y-auto flex-1 text-sm text-text-primary whitespace-pre-wrap">
                                    {compareResults ? compareResults.raw : (
                                        <div className="h-full flex items-center justify-center text-text-muted italic">Run a comparison to see baseline limitations.</div>
                                    )}
                                </div>
                            </div>

                            {/* Right: With SAP */}
                            <div className="flex flex-col bg-surface border border-border rounded-xl overflow-hidden h-full">
                                <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-emerald-400 font-bold">
                                    <Database size={18} />
                                    Tether + SAP Connected
                                </div>
                                <div className="p-5 overflow-y-auto flex-1 text-sm text-text-primary whitespace-pre-wrap">
                                    {compareResults ? compareResults.sap : (
                                        <div className="h-full flex items-center justify-center text-text-muted italic">Run a comparison to see real-time data injection.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
