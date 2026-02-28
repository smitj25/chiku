"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Database,
    ShieldCheck,
    MessageSquare,
    Plus,
    Trash2,
    GripVertical,
    Upload,
    Send,
} from "lucide-react";

const TABS = [
    { id: "persona", label: "Persona", icon: User },
    { id: "knowledge", label: "Knowledge Base", icon: Database },
    { id: "guardrails", label: "Guardrails", icon: ShieldCheck },
    { id: "playground", label: "Test Playground", icon: MessageSquare },
];

const SAMPLE_STEPS = [
    "Identify the user's query intent and classify by domain area",
    "Retrieve relevant document chunks from the knowledge base",
    "Cross-reference retrieved facts with source documents",
    "Generate response with inline citations",
    "Apply guardrail filters before returning response",
];

const UPLOADED_DOCS = [
    { name: "GDPR_Full_Text.pdf", size: "2.4 MB", status: "ready" },
    { name: "Contract_Template_v3.pdf", size: "890 KB", status: "ready" },
    { name: "IP_Law_Reference.pdf", size: "1.8 MB", status: "processing" },
];

const FORBIDDEN_TOPICS = [
    "Political opinions",
    "Financial advice",
    "Medical diagnosis",
    "Personal data sharing",
];

export default function ConfiguratorPage() {
    const [activeTab, setActiveTab] = useState("persona");
    const [persona, setPersona] = useState(
        "You are a legal subject matter expert specializing in contract law, GDPR compliance, and intellectual property. You provide precise, cited analysis of legal documents and clauses. You always reference specific articles, sections, and page numbers from source documents."
    );
    const [steps, setSteps] = useState(SAMPLE_STEPS);
    const [newStep, setNewStep] = useState("");
    const [topics, setTopics] = useState(FORBIDDEN_TOPICS);
    const [newTopic, setNewTopic] = useState("");
    const [piiRedaction, setPiiRedaction] = useState(true);
    const [citationMode, setCitationMode] = useState<"warn" | "block">("block");
    const [chatMessages, setChatMessages] = useState<
        { role: string; content: string }[]
    >([
        {
            role: "system",
            content:
                "Plugin loaded: Legal SME v1.0 • RAGAS: 0.93 • Guardrails: active",
        },
    ]);
    const [chatInput, setChatInput] = useState("");

    const addStep = () => {
        if (newStep.trim()) {
            setSteps([...steps, newStep.trim()]);
            setNewStep("");
        }
    };

    const removeStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const addTopic = () => {
        if (newTopic.trim()) {
            setTopics([...topics, newTopic.trim()]);
            setNewTopic("");
        }
    };

    const removeTopic = (index: number) => {
        setTopics(topics.filter((_, i) => i !== index));
    };

    const sendMessage = () => {
        if (!chatInput.trim()) return;
        const userMsg = { role: "user", content: chatInput };
        setChatMessages((prev) => [
            ...prev,
            userMsg,
            {
                role: "assistant",
                content: `Based on my analysis of the uploaded documents, ${chatInput.toLowerCase().includes("clause") ? "Clause 4.2 establishes a liability framework under GDPR Article 83(5). The current wording creates potential unlimited exposure. [Source: Contract_v3.pdf, pg 12] [Source: GDPR Art.83, pg 47] ✓ Verified" : "I've found relevant information in the knowledge base. Let me provide a cited response with references to the source documents. ✓ Verified"}`,
            },
        ]);
        setChatInput("");
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
                        Plugin Configurator
                    </h1>
                    <p className="font-mono text-sm text-text-muted">
                        Customize your Legal SME plugin
                    </p>
                </div>
                <button className="bg-lime text-canvas font-mono font-bold text-xs tracking-[0.06em] px-5 py-2.5 hover:opacity-90 transition-opacity cursor-pointer border-none">
                    DEPLOY CHANGES →
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-surface border border-border rounded-lg p-1 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 font-mono text-[12px] px-4 py-2.5 rounded-md transition-all cursor-pointer border-none whitespace-nowrap ${activeTab === tab.id
                                ? "bg-[rgba(163,230,53,0.1)] text-lime border border-[rgba(163,230,53,0.2)]"
                                : "text-text-muted hover:text-text-primary bg-transparent"
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* ── PERSONA TAB ── */}
                {activeTab === "persona" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {/* System prompt */}
                            <div className="bg-surface border border-border rounded-lg p-6">
                                <div className="font-mono text-[11px] text-text-faint tracking-[0.1em] mb-3">
                                    SYSTEM PERSONA
                                </div>
                                <textarea
                                    value={persona}
                                    onChange={(e) => setPersona(e.target.value)}
                                    rows={6}
                                    className="w-full bg-canvas border border-border rounded-md p-4 font-mono text-sm text-text-primary outline-none focus:border-lime transition-colors resize-y leading-[1.6]"
                                />
                            </div>

                            {/* Decision tree */}
                            <div className="bg-surface border border-border rounded-lg p-6">
                                <div className="font-mono text-[11px] text-text-faint tracking-[0.1em] mb-3">
                                    DECISION TREE STEPS
                                </div>
                                <div className="space-y-2 mb-4">
                                    {steps.map((step, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 bg-canvas border border-border rounded-md px-3 py-2"
                                        >
                                            <GripVertical
                                                size={12}
                                                className="text-text-ghost cursor-grab shrink-0"
                                            />
                                            <span className="font-mono text-[10px] text-lime font-bold shrink-0">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <span className="font-mono text-xs text-text-primary flex-1">
                                                {step}
                                            </span>
                                            <button
                                                onClick={() => removeStep(i)}
                                                className="text-text-ghost hover:text-red-stat transition-colors cursor-pointer bg-transparent border-none"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newStep}
                                        onChange={(e) => setNewStep(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addStep()}
                                        placeholder="Add a new step..."
                                        className="flex-1 bg-canvas border border-border rounded-md px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-ghost outline-none focus:border-lime"
                                    />
                                    <button
                                        onClick={addStep}
                                        className="bg-surface border border-border rounded-md px-3 py-2 text-text-muted hover:text-lime hover:border-lime transition-all cursor-pointer"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-surface border border-border rounded-lg p-6">
                            <div className="font-mono text-[11px] text-text-faint tracking-[0.1em] mb-3">
                                FINAL SYSTEM PROMPT PREVIEW
                            </div>
                            <div className="bg-canvas border border-border rounded-md p-4 font-mono text-xs text-text-muted leading-[1.8] max-h-[500px] overflow-y-auto">
                                <div className="text-lime mb-2">
                                    {"// System Persona"}
                                </div>
                                <div className="mb-4 text-text-primary">{persona}</div>
                                <div className="text-lime mb-2">
                                    {"// Decision Tree"}
                                </div>
                                {steps.map((s, i) => (
                                    <div key={i} className="mb-1">
                                        <span className="text-plug-engineering">
                                            Step {i + 1}:
                                        </span>{" "}
                                        <span className="text-text-secondary">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── KNOWLEDGE BASE TAB ── */}
                {activeTab === "knowledge" && (
                    <div className="space-y-6">
                        {/* Upload area */}
                        <div className="bg-surface border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-lime transition-colors cursor-pointer">
                            <Upload size={32} className="text-text-ghost mx-auto mb-3" />
                            <div className="font-mono text-sm text-text-muted mb-1">
                                Drop PDF files here or click to upload
                            </div>
                            <div className="font-mono text-[11px] text-text-ghost">
                                Supports PDF, DOCX, TXT • Max 50MB per file
                            </div>
                        </div>

                        {/* File list */}
                        <div className="bg-surface border border-border rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="font-mono text-[11px] text-text-faint tracking-[0.1em]">
                                    UPLOADED DOCUMENTS
                                </div>
                                <button className="font-mono text-[11px] text-lime border border-[rgba(163,230,53,0.3)] rounded-md px-3 py-1.5 hover:bg-[rgba(163,230,53,0.05)] transition-all cursor-pointer bg-transparent">
                                    RE-INDEX ALL
                                </button>
                            </div>
                            <div className="space-y-2">
                                {UPLOADED_DOCS.map((doc, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 bg-canvas border border-border rounded-md px-4 py-3"
                                    >
                                        <div className="font-mono text-sm text-text-primary flex-1">
                                            {doc.name}
                                        </div>
                                        <div className="font-mono text-[11px] text-text-ghost">
                                            {doc.size}
                                        </div>
                                        <span
                                            className={`font-mono text-[10px] px-2 py-0.5 rounded-[3px] ${doc.status === "ready"
                                                    ? "bg-[rgba(52,211,153,0.1)] text-plug-healthcare border border-[rgba(52,211,153,0.3)]"
                                                    : "bg-[rgba(251,191,36,0.1)] text-plug-engineering border border-[rgba(251,191,36,0.3)]"
                                                }`}
                                        >
                                            {doc.status.toUpperCase()}
                                        </span>
                                        <button className="text-text-ghost hover:text-red-stat transition-colors cursor-pointer bg-transparent border-none">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── GUARDRAILS TAB ── */}
                {activeTab === "guardrails" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {/* Forbidden topics */}
                            <div className="bg-surface border border-border rounded-lg p-6">
                                <div className="font-mono text-[11px] text-text-faint tracking-[0.1em] mb-3">
                                    FORBIDDEN TOPICS
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {topics.map((topic, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)] text-red-stat rounded-md px-2.5 py-1 font-mono text-[11px]"
                                        >
                                            {topic}
                                            <button
                                                onClick={() => removeTopic(i)}
                                                className="hover:text-red-400 cursor-pointer bg-transparent border-none text-red-stat"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={newTopic}
                                        onChange={(e) => setNewTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addTopic()}
                                        placeholder="Add forbidden topic..."
                                        className="flex-1 bg-canvas border border-border rounded-md px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-ghost outline-none focus:border-lime"
                                    />
                                    <button
                                        onClick={addTopic}
                                        className="bg-surface border border-border rounded-md px-3 py-2 text-text-muted hover:text-lime hover:border-lime transition-all cursor-pointer"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* PII toggle */}
                            <div className="bg-surface border border-border rounded-lg p-6">
                                <div className="font-mono text-[11px] text-text-faint tracking-[0.1em] mb-4">
                                    PII REDACTION
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-mono text-sm text-text-primary">
                                            Automatic PII redaction
                                        </div>
                                        <div className="font-mono text-[11px] text-text-ghost">
                                            Redact names, emails, phone numbers from responses
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPiiRedaction(!piiRedaction)}
                                        className={`w-12 h-6 rounded-full transition-all cursor-pointer border-none ${piiRedaction ? "bg-lime" : "bg-[rgba(255,255,255,0.1)]"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 bg-white rounded-full transition-transform ${piiRedaction ? "translate-x-6" : "translate-x-0.5"
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Citation mode */}
                        <div className="bg-surface border border-border rounded-lg p-6">
                            <div className="font-mono text-[11px] text-text-faint tracking-[0.1em] mb-4">
                                CITATION STRICTNESS
                            </div>
                            <div className="space-y-3">
                                {[
                                    {
                                        value: "warn" as const,
                                        title: "Warn Mode",
                                        desc: "Flag uncited claims but still return response",
                                    },
                                    {
                                        value: "block" as const,
                                        title: "Block Mode",
                                        desc: "Reject response entirely if any claim lacks citation",
                                    },
                                ].map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => setCitationMode(mode.value)}
                                        className={`w-full text-left p-4 rounded-md transition-all cursor-pointer border ${citationMode === mode.value
                                                ? "bg-[rgba(163,230,53,0.05)] border-[rgba(163,230,53,0.3)]"
                                                : "bg-canvas border-border hover:border-border-hover"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${citationMode === mode.value
                                                        ? "border-lime"
                                                        : "border-text-ghost"
                                                    }`}
                                            >
                                                {citationMode === mode.value && (
                                                    <div className="w-2 h-2 rounded-full bg-lime" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-mono text-sm text-text-primary">
                                                    {mode.title}
                                                </div>
                                                <div className="font-mono text-[11px] text-text-ghost">
                                                    {mode.desc}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TEST PLAYGROUND TAB ── */}
                {activeTab === "playground" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chat */}
                        <div className="lg:col-span-2 bg-surface border border-border rounded-lg flex flex-col h-[600px]">
                            <div className="px-4 py-3 border-b border-border font-mono text-[11px] text-text-faint tracking-[0.1em]">
                                TEST PLAYGROUND
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                {chatMessages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-lg px-4 py-3 font-mono text-xs leading-[1.7] ${msg.role === "user"
                                                    ? "bg-[rgba(163,230,53,0.1)] border border-[rgba(163,230,53,0.2)] text-text-primary"
                                                    : msg.role === "system"
                                                        ? "bg-canvas border border-border text-text-ghost text-[11px]"
                                                        : "bg-canvas border border-border text-text-secondary"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-border flex gap-2">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Test a query..."
                                    className="w-full bg-canvas border border-border rounded-md px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-ghost outline-none focus:border-lime"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="bg-lime text-canvas rounded-md px-3 py-2 hover:opacity-90 transition-opacity cursor-pointer border-none"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Info panel */}
                        <div className="space-y-4">
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <div className="font-mono text-[10px] text-text-faint tracking-[0.1em] mb-3">
                                    ACTIVE GUARDRAILS
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-plug-healthcare" />
                                        <span className="font-mono text-[11px] text-text-muted">
                                            PII Redaction: ON
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-lime" />
                                        <span className="font-mono text-[11px] text-text-muted">
                                            Citation Mode: BLOCK
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-stat" />
                                        <span className="font-mono text-[11px] text-text-muted">
                                            Forbidden: 4 topics
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface border border-border rounded-lg p-4">
                                <div className="font-mono text-[10px] text-text-faint tracking-[0.1em] mb-3">
                                    RETRIEVED CHUNKS
                                </div>
                                <div className="space-y-2">
                                    {[
                                        {
                                            doc: "Contract_v3.pdf",
                                            page: "12",
                                            relevance: "0.94",
                                        },
                                        {
                                            doc: "GDPR_Full_Text.pdf",
                                            page: "47",
                                            relevance: "0.91",
                                        },
                                        {
                                            doc: "IP_Law_Reference.pdf",
                                            page: "8",
                                            relevance: "0.87",
                                        },
                                    ].map((chunk, i) => (
                                        <div
                                            key={i}
                                            className="bg-canvas border border-border rounded-md p-2.5"
                                        >
                                            <div className="font-mono text-[11px] text-text-primary">
                                                {chunk.doc}
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="font-mono text-[10px] text-text-ghost">
                                                    Page {chunk.page}
                                                </span>
                                                <span className="font-mono text-[10px] text-lime">
                                                    {chunk.relevance}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
