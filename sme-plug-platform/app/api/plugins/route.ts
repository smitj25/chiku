import { NextRequest, NextResponse } from "next/server";

const PLUGINS = [
    { id: "legal-v1", name: "Legal SME", domain: "Compliance & Contracts", score: 0.93, price: 500, status: "active" },
    { id: "healthcare-v1", name: "Healthcare SME", domain: "Clinical & Compliance", score: 0.91, price: 500, status: "active" },
    { id: "engineering-v1", name: "Engineering SME", domain: "Structural & Safety", score: 0.91, price: 500, status: "available" },
    { id: "finance-v1", name: "Finance SME", domain: "Banking & Risk", score: 0.89, price: 500, status: "available" },
    { id: "education-v1", name: "Education SME", domain: "Curriculum & Assessment", score: 0.88, price: 500, status: "available" },
    { id: "cyber-v1", name: "Cybersecurity SME", domain: "Threat & Compliance", score: 0.90, price: 500, status: "available" },
];

export async function GET() {
    return NextResponse.json({ plugins: PLUGINS });
}

export async function POST(req: NextRequest) {
    try {
        const { pluginId } = await req.json();

        const plugin = PLUGINS.find((p) => p.id === pluginId);
        if (!plugin) {
            return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
        }

        // TODO: Replace with actual purchase/activation logic
        return NextResponse.json({
            message: `Plugin ${plugin.name} purchased successfully`,
            plugin: { ...plugin, status: "active", activatedAt: new Date().toISOString() },
        });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
