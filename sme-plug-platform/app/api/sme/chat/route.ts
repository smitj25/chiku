import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { message, session_id, plugin_id } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "message is required" }, { status: 400 });
        }

        // TODO: Proxy to FastAPI backend
        // const backendUrl = process.env.FASTAPI_URL || "http://localhost:8000";
        // const response = await fetch(`${backendUrl}/sme/chat`, { ... });

        // Stub: return mock response
        return NextResponse.json({
            response: `Based on analysis of the relevant documents, here is the answer to your query: "${message}". This response includes verified citations from the knowledge base.`,
            citations: [
                { source: "Reference_Document.pdf", page: 12, relevance: 0.94 },
                { source: "Guidelines_v2.pdf", page: 7, relevance: 0.89 },
            ],
            verified: true,
            ragas_score: 0.92,
            session_id: session_id || `session_${Date.now()}`,
            plugin_id: plugin_id || "unknown",
        });
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
}
