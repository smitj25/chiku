export default function TerminalSnippet() {
    return (
        <div className="rounded-lg border border-border overflow-hidden font-mono text-[13px] leading-[1.8] bg-canvas-subtle">
            {/* Window chrome */}
            <div className="px-4 py-2.5 bg-surface-hover border-b border-border flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                <span className="text-text-ghost text-xs ml-2">index.ts</span>
            </div>

            {/* Code content */}
            <div className="p-5 md:p-6">
                <div className="text-[#6b7280]">{"// Install the SDK"}</div>
                <div>
                    <span className="text-lime">npm</span>{" "}
                    <span className="text-text-secondary">install @tether/sdk</span>
                </div>
                <div className="h-[1.8em]" />
                <div className="text-[#6b7280]">{"// Use in your project"}</div>
                <div>
                    <span className="text-[#818cf8]">import</span>{" "}
                    <span className="text-text-secondary">{"{ Tether }"}</span>{" "}
                    <span className="text-[#818cf8]">from</span>{" "}
                    <span className="text-plug-healthcare">{`'@tether/sdk'`}</span>
                </div>
                <div className="h-[1.8em]" />
                <div>
                    <span className="text-[#818cf8]">const</span>{" "}
                    <span className="text-plug-engineering">client</span>{" "}
                    <span className="text-text-secondary">=</span>{" "}
                    <span className="text-[#818cf8]">new</span>{" "}
                    <span className="text-plug-legal">Tether</span>
                    <span className="text-text-secondary">{"({"}</span>
                </div>
                <div className="pl-4">
                    <span className="text-plug-healthcare">apiKey</span>
                    <span className="text-text-secondary">:</span>{" "}
                    <span className="text-[#fca5a5]">process</span>
                    <span className="text-text-secondary">.env.</span>
                    <span className="text-lime">TETHER_API_KEY</span>
                    <span className="text-text-secondary">,</span>
                </div>
                <div className="pl-4">
                    <span className="text-plug-healthcare">pluginId</span>
                    <span className="text-text-secondary">:</span>{" "}
                    <span className="text-plug-engineering">{`'legal-v1'`}</span>
                    <span className="text-text-secondary">,</span>
                </div>
                <div className="text-text-secondary">{"});"}</div>
                <div className="h-[1.8em]" />
                <div>
                    <span className="text-[#818cf8]">const</span>{" "}
                    <span className="text-plug-engineering">res</span>{" "}
                    <span className="text-text-secondary">=</span>{" "}
                    <span className="text-[#818cf8]">await</span>{" "}
                    <span className="text-plug-engineering">client</span>
                    <span className="text-text-secondary">.</span>
                    <span className="text-plug-legal">chat</span>
                    <span className="text-text-secondary">(</span>
                    <span className="text-plug-engineering">{`'Analyze clause 4.2'`}</span>
                    <span className="text-text-secondary">);</span>
                </div>
                <div className="text-[#6b7280]">
                    {"// → { response, citations: [{ source, page }] }"}
                </div>
            </div>
        </div>
    );
}
