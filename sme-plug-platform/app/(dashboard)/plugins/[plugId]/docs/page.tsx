"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { use } from "react";

const DOCS: Record<string, { title: string; sections: { heading: string; content: string; code?: string }[] }> = {
    "legal-v1": {
        title: "Legal SME",
        sections: [
            { heading: "Getting Started", content: "The Legal SME plugin provides enterprise-grade legal analysis with citation verification. Every claim is backed by references to source documents with page numbers." },
            { heading: "Installation", content: "Install the SME-Plug SDK via your preferred package manager:", code: "# npm\nnpm install @smeplug/sdk\n\n# pip\npip install smeplug" },
            { heading: "Quick Start", content: "Initialize the client with your API key and plugin ID:", code: "import { SMEPlug } from '@smeplug/sdk'\n\nconst plug = new SMEPlug({\n  apiKey: process.env.SME_API_KEY,\n  pluginId: 'legal-v1'\n})\n\nconst res = await plug.chat('Analyze clause 4.2 for liability exposure.')\nconsole.log(res.response)    // Cited analysis\nconsole.log(res.citations)   // [{ source, page }]" },
            { heading: "REST API", content: "You can also call the API directly:", code: "POST https://api.smeplug.dev/v1/chat\nHeaders:\n  Authorization: Bearer sme_live_xxxx\n  Content-Type: application/json\nBody:\n  {\n    \"message\": \"What are the GDPR penalties?\",\n    \"session_id\": \"optional-session-id\"\n  }" },
            { heading: "Response Format", content: "All responses include citations and a verification status:", code: "{\n  \"response\": \"Under GDPR Article 83(5), penalties...\",\n  \"citations\": [\n    { \"source\": \"GDPR_Full_Text.pdf\", \"page\": 47 },\n    { \"source\": \"Contract_v3.pdf\", \"page\": 12 }\n  ],\n  \"verified\": true,\n  \"ragas_score\": 0.93\n}" },
            { heading: "Configuration", content: "Customize the plugin behavior via the Configurator at /plugins/legal-v1/configure. You can set up a custom persona, upload domain-specific documents, configure guardrails, and test queries in the playground." },
            { heading: "VS Code Extension", content: "Install the SME-Plug extension from the VS Code Marketplace. Configure your API key in settings.json:", code: "// .vscode/settings.json\n{\n  \"smeplug.apiKey\": \"sme_live_xxxx\",\n  \"smeplug.pluginId\": \"legal-v1\"\n}" },
            { heading: "Rate Limits", content: "Rate limits depend on your plan:\n• Starter: 10,000 queries/month\n• Professional: 100,000 queries/month\n• Enterprise: Unlimited\n\nRate limit headers are included in every response." },
        ],
    },
    "healthcare-v1": {
        title: "Healthcare SME",
        sections: [
            { heading: "Getting Started", content: "The Healthcare SME plugin provides clinical intelligence with HIPAA-compliant data handling. All responses include citations to medical literature and clinical guidelines." },
            { heading: "Installation", content: "Install the SME-Plug SDK:", code: "# npm\nnpm install @smeplug/sdk\n\n# pip\npip install smeplug" },
            { heading: "Quick Start", content: "Initialize with your healthcare plugin:", code: "import { SMEPlug } from '@smeplug/sdk'\n\nconst plug = new SMEPlug({\n  apiKey: process.env.SME_API_KEY,\n  pluginId: 'healthcare-v1'\n})\n\nconst res = await plug.chat(\n  'Summarize treatment protocol for Type 2 Diabetes per ADA 2024.'\n)\n// Returns cited clinical guidance" },
            { heading: "HIPAA Compliance", content: "The Healthcare SME is designed with HIPAA compliance in mind. PII redaction is enabled by default. All data is encrypted in transit and at rest. No patient data is stored or used for training." },
            { heading: "Supported Domains", content: "• Clinical Notes summarization\n• ICD-10/11 coding assistance\n• Drug interaction checking (FDA database)\n• EHR data extraction\n• Clinical trial protocol review\n• Treatment guideline lookup (ADA, WHO)" },
        ],
    },
};

function getDocs(plugId: string) {
    return DOCS[plugId] || {
        title: plugId.replace("-v1", "").charAt(0).toUpperCase() + plugId.replace("-v1", "").slice(1) + " SME",
        sections: [
            { heading: "Getting Started", content: "Install the SME-Plug SDK and initialize with your API key.", code: "npm install @smeplug/sdk" },
            { heading: "Usage", content: "import { SMEPlug } from '@smeplug/sdk'\nconst plug = new SMEPlug({ apiKey: 'sme_live_xxx', pluginId: '" + plugId + "' })" },
        ],
    };
}

export default function PluginDocsPage({ params }: { params: Promise<{ plugId: string }> }) {
    const { plugId } = use(params);
    const docs = getDocs(plugId);
    const [copied, setCopied] = useState<number | null>(null);

    const copyCode = (code: string, idx: number) => {
        navigator.clipboard.writeText(code);
        setCopied(idx);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div>
            <Link href={`/plugins/${plugId}`} className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted no-underline hover:text-lime mb-6">
                <ArrowLeft size={14} /> Back to {docs.title}
            </Link>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="font-display text-3xl font-bold text-text-primary mb-2">{docs.title} — Documentation</h1>
                <p className="font-mono text-sm text-text-muted">Integration guide, API reference, and configuration</p>
            </motion.div>

            <div className="max-w-3xl space-y-8">
                {docs.sections.map((section, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-surface border border-border rounded-lg p-6">
                        <h2 className="font-display text-xl font-bold text-text-primary mb-3">{section.heading}</h2>
                        <div className="font-mono text-sm text-text-muted leading-[1.8] whitespace-pre-line mb-4">{section.content}</div>
                        {section.code && (
                            <div className="relative">
                                <button onClick={() => copyCode(section.code!, i)}
                                    className="absolute top-3 right-3 text-text-ghost hover:text-lime transition-colors cursor-pointer bg-transparent border-none z-10">
                                    {copied === i ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                                <pre className="bg-canvas border border-border rounded-md p-4 font-mono text-xs text-text-secondary leading-[1.8] overflow-x-auto">
                                    {section.code}
                                </pre>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
