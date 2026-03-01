// ── Shared data constants for the landing page ──────────────────────────────

export const PLUGS = [
    {
        id: "legal",
        name: "Legal SME",
        domain: "Compliance & Contracts",
        color: "#60a5fa",
        bg: "rgba(96,165,250,0.08)",
        border: "rgba(96,165,250,0.25)",
        score: 0.93,
        price: 500,
        icon: "⚖",
        tags: ["Contract Review", "GDPR", "Litigation", "IP Law"],
        example:
            "Analyze clause 4.2 for liability exposure under GDPR Article 83.",
    },
    {
        id: "healthcare",
        name: "Healthcare SME",
        domain: "Clinical & Compliance",
        color: "#34d399",
        bg: "rgba(52,211,153,0.08)",
        border: "rgba(52,211,153,0.25)",
        score: 0.91,
        price: 500,
        icon: "⚕",
        tags: ["Clinical Notes", "ICD Coding", "Drug Interactions", "EHR"],
        example:
            "Summarize treatment protocol for Type 2 Diabetes per ADA 2024.",
    },
    {
        id: "engineering",
        name: "Engineering SME",
        domain: "Structural & Safety",
        color: "#fbbf24",
        bg: "rgba(251,191,36,0.08)",
        border: "rgba(251,191,36,0.25)",
        score: 0.91,
        price: 500,
        icon: "⚙",
        tags: ["Load Analysis", "Material Specs", "Safety Codes", "AISC"],
        example:
            "Calculate dead load factor for W18x35 steel beam, 40ft span.",
    },
];

export const ALL_PLUGS = [
    ...PLUGS,
    {
        id: "finance",
        name: "Finance SME",
        domain: "Banking & Risk",
        color: "#c084fc",
        bg: "rgba(192,132,252,0.08)",
        border: "rgba(192,132,252,0.25)",
        score: 0.89,
        price: 500,
        icon: "💹",
        tags: ["Risk Models", "Basel III", "Fraud Detection", "KYC"],
        example: "Evaluate credit risk exposure for portfolio segment A under Basel III.",
    },
    {
        id: "education",
        name: "Education SME",
        domain: "Curriculum & Assessment",
        color: "#f472b6",
        bg: "rgba(244,114,182,0.08)",
        border: "rgba(244,114,182,0.25)",
        score: 0.88,
        price: 500,
        icon: "📚",
        tags: ["Curriculum Design", "Assessment", "Bloom's Taxonomy", "IEP"],
        example: "Create a rubric for evaluating 8th-grade argumentative essays.",
    },
    {
        id: "cyber",
        name: "Cybersecurity SME",
        domain: "Threat & Compliance",
        color: "#fb923c",
        bg: "rgba(251,146,60,0.08)",
        border: "rgba(251,146,60,0.25)",
        score: 0.90,
        price: 500,
        icon: "🛡",
        tags: ["NIST", "SOC 2", "Pen Testing", "Incident Response"],
        example: "Assess NIST CSF compliance gaps for cloud infrastructure.",
    },
];

export const STATS = [
    {
        value: "40%",
        label: "of enterprise AI projects cancelled by 2027",
        source: "Gartner",
    },
    {
        value: "20%",
        label: "of AI-generated code contains hallucinated packages",
        source: "Research",
    },
    {
        value: "$50B",
        label: "enterprise AI governance market by 2028",
        source: "IDC",
    },
];

export const STEPS = [
    {
        step: "01",
        title: "Buy a Plug",
        desc: "Browse our marketplace. Choose your domain. One click purchase.",
    },
    {
        step: "02",
        title: "Get your API Key",
        desc: "Generate a scoped key in your dashboard. Works instantly.",
    },
    {
        step: "03",
        title: "Import to your IDE",
        desc: "VS Code, Cursor, JetBrains, npm, pip, or raw REST API.",
    },
];

export const IDE_LOGOS = [
    "VS Code",
    "Cursor",
    "JetBrains",
    "npm",
    "pip",
    "REST API",
];

export const PLANS = [
    {
        name: "Starter",
        price: 500,
        limit: "Up to 2 plugs",
        features: [
            "2 SME plugs",
            "10k queries/month",
            "API key access",
            "Community support",
        ],
        cta: "Start free trial",
        highlight: false,
    },
    {
        name: "Professional",
        price: 1500,
        limit: "Up to 5 plugs",
        features: [
            "5 SME plugs",
            "100k queries/month",
            "Custom configurator",
            "Priority support",
            "RAGAS dashboard",
        ],
        cta: "Start free trial",
        highlight: true,
    },
    {
        name: "Enterprise",
        price: 2000,
        limit: "Unlimited plugs",
        features: [
            "Unlimited SME plugs",
            "Unlimited queries",
            "Custom plug builder",
            "SLA guarantee",
            "Dedicated CSM",
            "SSO + audit logs",
        ],
        cta: "Contact sales",
        highlight: false,
    },
];
