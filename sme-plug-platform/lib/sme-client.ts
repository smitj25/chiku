// lib/sme-client.ts — SDK wrapper for the FastAPI RAG backend

const BACKEND_URL =
    process.env.FASTAPI_URL || "http://localhost:8000";

export interface ChatResponse {
    response: string;
    citations: { source: string; page: number; relevance: number }[];
    verified: boolean;
    ragas_score: number;
    session_id: string;
}

export interface EvalResponse {
    faithfulness: number;
    answer_relevancy: number;
    context_precision: number;
    overall: number;
}

/** Send a chat query to the FastAPI backend */
export async function smeChat({
    message,
    pluginId,
    sessionId,
    apiKey,
}: {
    message: string;
    pluginId: string;
    sessionId?: string;
    apiKey: string;
}): Promise<ChatResponse> {
    const res = await fetch(`${BACKEND_URL}/sme/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            message,
            plugin_id: pluginId,
            session_id: sessionId,
        }),
    });

    if (!res.ok) {
        throw new Error(`SME backend error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

/** Get RAGAS evaluation scores for a plugin */
export async function smeEval(pluginId: string): Promise<EvalResponse> {
    const res = await fetch(`${BACKEND_URL}/eval/${pluginId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
        throw new Error(`SME eval error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

/** Upload a document to the RAG knowledge base */
export async function smeUploadDoc({
    pluginId,
    file,
    apiKey,
}: {
    pluginId: string;
    file: File;
    apiKey: string;
}): Promise<{ documentId: string; status: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("plugin_id", pluginId);

    const res = await fetch(`${BACKEND_URL}/rag/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
    });

    if (!res.ok) {
        throw new Error(`SME upload error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

/** Re-index the knowledge base for a plugin */
export async function smeReindex(pluginId: string, apiKey: string) {
    const res = await fetch(`${BACKEND_URL}/rag/reindex/${pluginId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
    });

    if (!res.ok) {
        throw new Error(`SME reindex error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}
