"use client";
import { useState, useEffect, useRef } from "react";

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
// Aesthetic: Dark industrial terminal meets precision enterprise SaaS
// Font pairing: Departure Mono (code/display) + Instrument Sans (body)
// Color: Near-black canvas, electric lime accent, muted steel tones

const PLUGS = [
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
    example: "Analyze clause 4.2 for liability exposure under GDPR Article 83.",
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
    example: "Summarize treatment protocol for Type 2 Diabetes per ADA 2024.",
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
    example: "Calculate dead load factor for W18x35 steel beam, 40ft span.",
  },
];

const STATS = [
  { value: "40%", label: "of enterprise AI projects cancelled by 2027", source: "Gartner" },
  { value: "20%", label: "of AI-generated code contains hallucinated packages", source: "Research" },
  { value: "$50B", label: "enterprise AI governance market by 2028", source: "IDC" },
];

const STEPS = [
  { step: "01", title: "Buy a Plug", desc: "Browse our marketplace. Choose your domain. One click purchase." },
  { step: "02", title: "Get your API Key", desc: "Generate a scoped key in your dashboard. Works instantly." },
  { step: "03", title: "Import to your IDE", desc: "VS Code, Cursor, JetBrains, npm, pip, or raw REST API." },
];

const IDE_LOGOS = ["VS Code", "Cursor", "JetBrains", "npm", "pip", "REST API"];

const PLANS = [
  {
    name: "Starter",
    price: 500,
    limit: "Up to 2 plugs",
    features: ["2 SME plugs", "10k queries/month", "API key access", "Community support"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: 1500,
    limit: "Up to 5 plugs",
    features: ["5 SME plugs", "100k queries/month", "Custom configurator", "Priority support", "RAGAS dashboard"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 2000,
    limit: "Unlimited plugs",
    features: ["Unlimited SME plugs", "Unlimited queries", "Custom plug builder", "SLA guarantee", "Dedicated CSM", "SSO + audit logs"],
    cta: "Contact sales",
    highlight: false,
  },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 40px",
      height: "64px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(8,8,12,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "28px", height: "28px",
          background: "linear-gradient(135deg, #a3e635, #65a30d)",
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }} />
        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: "18px", color: "#f0f0f0", letterSpacing: "-0.02em" }}>
          sme<span style={{ color: "#a3e635" }}>plug</span>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        {["Docs", "Pricing", "Marketplace"].map(item => (
          <a key={item} href={`#${item.toLowerCase()}`} style={{
            fontFamily: "'Courier New', monospace", fontSize: "13px",
            color: "rgba(255,255,255,0.5)", textDecoration: "none",
            letterSpacing: "0.05em", transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = "#f0f0f0"}
            onMouseLeave={e => (e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
          >{item}</a>
        ))}
        <a href="/login" style={{
          fontFamily: "'Courier New', monospace", fontSize: "13px",
          color: "rgba(255,255,255,0.5)", textDecoration: "none",
          letterSpacing: "0.05em",
        }}>Login</a>
        <a href="/register" style={{
          fontFamily: "'Courier New', monospace", fontSize: "13px",
          background: "#a3e635", color: "#0a0a0f",
          padding: "8px 18px", textDecoration: "none",
          fontWeight: 700, letterSpacing: "0.05em",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={e => (e.target as HTMLElement).style.opacity = "0.85"}
          onMouseLeave={e => (e.target as HTMLElement).style.opacity = "1"}
        >GET STARTED →</a>
      </div>
    </nav>
  );
}

function TerminalSnippet() {
  const lines = [
    { indent: 0, content: <><span style={{ color: "#6b7280" }}>// Install the SDK</span></> },
    { indent: 0, content: <><span style={{ color: "#a3e635" }}>npm</span> <span style={{ color: "#e5e7eb" }}>install @smeplug/sdk</span></> },
    { indent: 0, content: <></> },
    { indent: 0, content: <><span style={{ color: "#6b7280" }}>// Use in your project</span></> },
    { indent: 0, content: <><span style={{ color: "#818cf8" }}>import</span> <span style={{ color: "#e5e7eb" }}>{"{ SMEPlug }"}</span> <span style={{ color: "#818cf8" }}>from</span> <span style={{ color: "#34d399" }}>'@smeplug/sdk'</span></> },
    { indent: 0, content: <></> },
    { indent: 0, content: <><span style={{ color: "#818cf8" }}>const</span> <span style={{ color: "#fbbf24" }}>plug</span> <span style={{ color: "#e5e7eb" }}>=</span> <span style={{ color: "#818cf8" }}>new</span> <span style={{ color: "#60a5fa" }}>SMEPlug</span><span style={{ color: "#e5e7eb" }}>({"{"}</span></> },
    { indent: 1, content: <><span style={{ color: "#34d399" }}>apiKey</span><span style={{ color: "#e5e7eb" }}>:</span> <span style={{ color: "#fca5a5" }}>process</span><span style={{ color: "#e5e7eb" }}>.env.</span><span style={{ color: "#a3e635" }}>SME_API_KEY</span><span style={{ color: "#e5e7eb" }}>,</span></> },
    { indent: 1, content: <><span style={{ color: "#34d399" }}>pluginId</span><span style={{ color: "#e5e7eb" }}>:</span> <span style={{ color: "#fbbf24" }}>'legal-v1'</span><span style={{ color: "#e5e7eb" }}>,</span></> },
    { indent: 0, content: <><span style={{ color: "#e5e7eb" }}>{"});"}</span></> },
    { indent: 0, content: <></> },
    { indent: 0, content: <><span style={{ color: "#818cf8" }}>const</span> <span style={{ color: "#fbbf24" }}>res</span> <span style={{ color: "#e5e7eb" }}>=</span> <span style={{ color: "#818cf8" }}>await</span> <span style={{ color: "#fbbf24" }}>plug</span><span style={{ color: "#e5e7eb" }}>.</span><span style={{ color: "#60a5fa" }}>chat</span><span style={{ color: "#e5e7eb" }}>(</span><span style={{ color: "#fbbf24" }}>'Analyze clause 4.2'</span><span style={{ color: "#e5e7eb" }}>);</span></> },
    { indent: 0, content: <><span style={{ color: "#6b7280" }}>// → {"{ response, citations: [{ source, page }] }"}</span></> },
  ];

  return (
    <div style={{
      background: "#0d1117",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      overflow: "hidden",
      fontFamily: "'Courier New', monospace",
      fontSize: "13px",
      lineHeight: "1.8",
    }}>
      <div style={{
        padding: "10px 16px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: "8px",
      }}>
        {["#ef4444", "#fbbf24", "#22c55e"].map(c => (
          <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
        ))}
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginLeft: "8px" }}>index.ts</span>
      </div>
      <div style={{ padding: "20px 24px" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ paddingLeft: `${line.indent * 16}px`, minHeight: "1.8em" }}>
            {line.content}
          </div>
        ))}
      </div>
    </div>
  );
}

function CitationBadge({ text }: { text: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
      color: "#fbbf24", borderRadius: "3px",
      padding: "2px 8px", fontSize: "11px",
      fontFamily: "'Courier New', monospace",
    }}>📎 {text}</span>
  );
}

function PlugCard({ plug, index }: { plug: typeof PLUGS[0], index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? plug.bg : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? plug.border : "rgba(255,255,255,0.06)"}`,
        borderRadius: "8px", padding: "28px",
        transition: "all 0.3s ease",
        cursor: "default",
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{
          width: "44px", height: "44px",
          background: plug.bg, border: `1px solid ${plug.border}`,
          borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px",
        }}>
          {plug.icon}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "2px" }}>RAGAS Score</div>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: "20px", fontWeight: 700, color: "#a3e635" }}>
            {plug.score.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "6px" }}>
        <span style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: plug.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {plug.domain}
        </span>
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: "#f0f0f0", marginBottom: "12px", letterSpacing: "-0.02em", fontFamily: "Georgia, serif" }}>
        {plug.name}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
        {plug.tags.map(tag => (
          <span key={tag} style={{
            fontFamily: "'Courier New', monospace", fontSize: "10px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.5)",
            padding: "3px 8px", borderRadius: "3px",
          }}>{tag}</span>
        ))}
      </div>

      <div style={{
        background: "rgba(0,0,0,0.3)", borderRadius: "6px", padding: "12px",
        fontFamily: "'Courier New', monospace", fontSize: "12px",
        color: "rgba(255,255,255,0.5)", marginBottom: "20px",
        borderLeft: `2px solid ${plug.color}`,
        fontStyle: "italic", lineHeight: 1.5,
      }}>
        "{plug.example}"
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: "22px", fontWeight: 700, color: "#f0f0f0" }}>
            ${plug.price}
          </span>
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            /plug/mo
          </span>
        </div>
        <button style={{
          background: hovered ? plug.color : "transparent",
          border: `1px solid ${plug.color}`,
          color: hovered ? "#0a0a0f" : plug.color,
          fontFamily: "'Courier New', monospace", fontSize: "12px",
          padding: "8px 16px", cursor: "pointer",
          fontWeight: 700, letterSpacing: "0.05em",
          transition: "all 0.2s ease",
        }}>
          BUY PLUG →
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  return (
    <div style={{
      background: "#08080c",
      color: "#e5e7eb",
      minHeight: "100vh",
      fontFamily: "Georgia, 'Times New Roman', serif",
    }}>
      {/* GLOBAL STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #08080c; }
        ::-webkit-scrollbar-thumb { background: rgba(163,230,53,0.3); }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-lime {
          0%, 100% { box-shadow: 0 0 0 0 rgba(163,230,53,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(163,230,53,0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .fade-in { animation: fadeInUp 0.6s ease forwards; opacity: 0; }
      `}</style>

      <NavBar />

      {/* SCANLINE EFFECT */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "120px 80px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* BG GLOW */}
        <div style={{
          position: "absolute", top: "20%", left: "55%",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(163,230,53,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div>
            {/* EYEBROW */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              border: "1px solid rgba(163,230,53,0.3)",
              background: "rgba(163,230,53,0.05)",
              padding: "6px 14px", marginBottom: "32px",
              fontFamily: "'Courier New', monospace", fontSize: "11px",
              color: "#a3e635", letterSpacing: "0.1em",
            }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: "#a3e635",
                animation: "pulse-lime 2s infinite",
              }} />
              B2B ENTERPRISE · DEVELOPER PLATFORM
            </div>

            <h1 style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(42px, 5vw, 68px)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#f5f5f5",
              marginBottom: "24px",
            }}>
              The AI Expert<br />
              That <span style={{
                color: "#a3e635",
                position: "relative",
              }}>
                Cites Its Sources
              </span>
            </h1>

            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "15px", lineHeight: 1.7,
              color: "rgba(255,255,255,0.45)",
              maxWidth: "480px", marginBottom: "40px",
            }}>
              Hot-swappable AI expert plugins for enterprise. Legal, Healthcare, Engineering.
              Every claim verified. Every fact cited. Zero hallucinations.
              Import to VS Code, Cursor, or any codebase in 60 seconds.
            </p>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <a href="/register" style={{
                background: "#a3e635", color: "#0a0a0f",
                fontFamily: "'Courier New', monospace", fontWeight: 700,
                fontSize: "14px", letterSpacing: "0.06em",
                padding: "14px 28px", textDecoration: "none",
                display: "inline-block",
                transition: "opacity 0.2s",
              }}
                onMouseEnter={e => (e.target as HTMLElement).style.opacity = "0.85"}
                onMouseLeave={e => (e.target as HTMLElement).style.opacity = "1"}
              >
                START FOR FREE →
              </a>
              <a href="#demo" style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'Courier New', monospace",
                fontSize: "14px", letterSpacing: "0.06em",
                padding: "14px 28px", textDecoration: "none",
                display: "inline-block",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.4)"}
                onMouseLeave={e => (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"}
              >
                VIEW DEMO
              </a>
            </div>

            {/* TRUST STRIP */}
            <div style={{ marginTop: "48px" }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", marginBottom: "12px" }}>
                WORKS WITH
              </div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {IDE_LOGOS.map(logo => (
                  <span key={logo} style={{
                    fontFamily: "'Courier New', monospace", fontSize: "12px",
                    color: "rgba(255,255,255,0.4)",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: "2px",
                  }}>{logo}</span>
                ))}
              </div>
            </div>
          </div>

          {/* CODE SNIPPET */}
          <div style={{ animation: "fadeInUp 0.8s ease 0.2s forwards", opacity: 0 }}>
            <TerminalSnippet />

            {/* SAMPLE RESPONSE */}
            <div style={{
              marginTop: "16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "8px", padding: "16px",
              fontFamily: "'Courier New', monospace", fontSize: "12px",
            }}>
              <div style={{ color: "rgba(255,255,255,0.3)", marginBottom: "10px", fontSize: "11px", letterSpacing: "0.05em" }}>
                → RESPONSE
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "10px" }}>
                Clause 4.2 creates unlimited liability exposure under GDPR Article 83(5)...
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <CitationBadge text="GDPR Art.83, pg 47" />
                <CitationBadge text="Contract_v3.pdf, pg 12" />
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
                  color: "#34d399", borderRadius: "3px",
                  padding: "2px 8px", fontSize: "11px",
                  fontFamily: "'Courier New', monospace",
                }}>✓ Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "60px 80px",
        background: "rgba(255,255,255,0.01)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
          {STATS.map((stat, i) => (
            <div key={i} style={{ borderLeft: "2px solid rgba(239,68,68,0.4)", paddingLeft: "24px" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "48px", fontWeight: 700, color: "#ef4444", lineHeight: 1, marginBottom: "8px" }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginBottom: "8px" }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
                SOURCE: {stat.source}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "100px 80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#a3e635", letterSpacing: "0.15em", marginBottom: "16px" }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "42px", fontWeight: 700, color: "#f5f5f5", letterSpacing: "-0.02em" }}>
              Three steps to trusted AI
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px" }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ position: "relative", padding: "32px" }}>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", top: "44px", right: "-20px",
                    width: "40px", height: "1px",
                    background: "rgba(163,230,53,0.3)",
                  }}>
                    <div style={{ position: "absolute", right: 0, top: "-4px", width: 0, height: 0, borderLeft: "6px solid rgba(163,230,53,0.5)", borderTop: "4px solid transparent", borderBottom: "4px solid transparent" }} />
                  </div>
                )}
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "52px", fontWeight: 700,
                  color: "rgba(163,230,53,0.15)",
                  lineHeight: 1, marginBottom: "16px",
                  letterSpacing: "-0.04em",
                }}>{step.step}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: 700, color: "#f0f0f0", marginBottom: "12px", letterSpacing: "-0.01em" }}>
                  {step.title}
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLUG MARKETPLACE ─────────────────────────────────────────────────── */}
      <section id="marketplace" style={{ padding: "80px 80px 100px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
            <div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#a3e635", letterSpacing: "0.15em", marginBottom: "12px" }}>
                SME PLUG MARKETPLACE
              </div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "42px", fontWeight: 700, color: "#f5f5f5", letterSpacing: "-0.02em" }}>
                Choose your expert
              </h2>
            </div>
            <a href="/marketplace" style={{
              fontFamily: "'Courier New', monospace", fontSize: "12px",
              color: "#a3e635", textDecoration: "none",
              letterSpacing: "0.05em",
              borderBottom: "1px solid rgba(163,230,53,0.3)", paddingBottom: "2px",
            }}>VIEW ALL PLUGS →</a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {PLUGS.map((plug, i) => <PlugCard key={plug.id} plug={plug} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "100px 80px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "#a3e635", letterSpacing: "0.15em", marginBottom: "16px" }}>
              PRICING
            </div>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: "42px", fontWeight: 700, color: "#f5f5f5", letterSpacing: "-0.02em", marginBottom: "16px" }}>
              Pay per plug, not per seat
            </h2>
            <p style={{ fontFamily: "'Courier New', monospace", fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
              Every plan includes API access, the configurator, and IDE plugins.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", alignItems: "start" }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? "rgba(163,230,53,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${plan.highlight ? "rgba(163,230,53,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "8px", padding: "32px",
                position: "relative",
                transform: plan.highlight ? "translateY(-8px)" : "none",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)",
                    background: "#a3e635", color: "#0a0a0f",
                    fontFamily: "'Courier New', monospace", fontSize: "10px", fontWeight: 700,
                    padding: "4px 12px", letterSpacing: "0.1em",
                  }}>MOST POPULAR</div>
                )}

                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: plan.highlight ? "#a3e635" : "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  {plan.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "48px", fontWeight: 700, color: "#f5f5f5", lineHeight: 1, marginBottom: "4px" }}>
                  ${plan.price.toLocaleString()}
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>
                  /plug/month
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {plan.limit}
                </div>

                <div style={{ marginBottom: "28px" }}>
                  {plan.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
                      <span style={{ color: "#a3e635", fontFamily: "'Courier New', monospace", fontSize: "13px", flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button style={{
                  width: "100%",
                  background: plan.highlight ? "#a3e635" : "transparent",
                  border: `1px solid ${plan.highlight ? "#a3e635" : "rgba(255,255,255,0.15)"}`,
                  color: plan.highlight ? "#0a0a0f" : "rgba(255,255,255,0.7)",
                  fontFamily: "'Courier New', monospace", fontSize: "13px",
                  fontWeight: plan.highlight ? 700 : 400,
                  padding: "12px", cursor: "pointer",
                  letterSpacing: "0.06em",
                  transition: "all 0.2s",
                }}>
                  {plan.cta.toUpperCase()} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section style={{
        padding: "100px 80px",
        background: "rgba(163,230,53,0.03)",
        borderTop: "1px solid rgba(163,230,53,0.1)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "52px", fontWeight: 700, color: "#f5f5f5", letterSpacing: "-0.03em", marginBottom: "20px", lineHeight: 1.1 }}>
            Ready to deploy<br />
            <span style={{ color: "#a3e635" }}>trusted AI?</span>
          </h2>
          <p style={{ fontFamily: "'Courier New', monospace", fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "40px", lineHeight: 1.7 }}>
            Join enterprises using SME-Plug to eliminate hallucination risk.<br />
            Up and running in 60 seconds. No credit card required.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <a href="/register" style={{
              background: "#a3e635", color: "#0a0a0f",
              fontFamily: "'Courier New', monospace", fontWeight: 700,
              fontSize: "15px", letterSpacing: "0.06em",
              padding: "16px 36px", textDecoration: "none",
            }}>GET STARTED FREE →</a>
            <a href="/marketplace" style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)",
              fontFamily: "'Courier New', monospace",
              fontSize: "15px", letterSpacing: "0.06em",
              padding: "16px 36px", textDecoration: "none",
            }}>BROWSE PLUGS</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 80px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", background: "linear-gradient(135deg, #a3e635, #65a30d)", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: "14px", fontWeight: 700, color: "#f0f0f0" }}>
            sme<span style={{ color: "#a3e635" }}>plug</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Docs", "Pricing", "Marketplace", "Privacy", "Terms"].map(item => (
            <a key={item} href="#" style={{
              fontFamily: "'Courier New', monospace", fontSize: "12px",
              color: "rgba(255,255,255,0.3)", textDecoration: "none",
              letterSpacing: "0.05em",
            }}>{item}</a>
          ))}
        </div>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
          © 2025 SME-Plug Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
