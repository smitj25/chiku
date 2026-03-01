import { NextResponse } from "next/server";

const PLUGINS: Record<string, object> = {
    "legal-v1": { id: "legal-v1", slug: "legal-v1", name: "Legal SME", domain: "Compliance & Contracts", score: 0.93, price: 500, color: "#60a5fa", description: "Enterprise-grade legal analysis with citation verification." },
    "healthcare-v1": { id: "healthcare-v1", slug: "healthcare-v1", name: "Healthcare SME", domain: "Clinical & Compliance", score: 0.91, price: 500, color: "#34d399", description: "Clinical intelligence with HIPAA-compliant data handling." },
    "engineering-v1": { id: "engineering-v1", slug: "engineering-v1", name: "Engineering SME", domain: "Structural & Safety", score: 0.91, price: 500, color: "#fbbf24", description: "Structural analysis and safety code verification." },
};

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ plugId: string }> }
) {
    const { plugId } = await params;
    const plugin = PLUGINS[plugId];
    if (!plugin) {
        return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
    }
    return NextResponse.json({ plugin });
}
