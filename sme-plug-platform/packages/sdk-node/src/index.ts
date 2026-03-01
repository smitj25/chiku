/**
 * Tether Node.js SDK
 *
 * @example
 * ```typescript
 * import { Tether } from '@tether/sdk'
 *
 * const plug = new Tether({
 *   apiKey: process.env.TETHER_API_KEY!,
 *   pluginId: 'legal-v1',
 * })
 *
 * const response = await plug.chat('What does clause 4.2 mean?')
 * console.log(response.text)       // Cited analysis
 * console.log(response.citations)  // [{ source, page }]
 * ```
 */

export interface TetherOptions {
    /** Your Tether API key (tether_live_xxx or tether_test_xxx) */
    apiKey: string;
    /** Plugin ID to use (e.g. 'legal-v1', 'healthcare-v1') */
    pluginId: string;
    /** API base URL (default: https://api.tether.dev) */
    baseUrl?: string;
    /** Enable streaming responses (default: false) */
    stream?: boolean;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
}

export interface Citation {
    source: string;
    page: number;
    relevance: number;
}

export interface ChatResponse {
    /** The AI-generated response text */
    text: string;
    /** Source citations for the response */
    citations: Citation[];
    /** Whether all citations were verified against source documents */
    verified: boolean;
    /** RAGAS faithfulness score (0.0 - 1.0) */
    ragasScore: number;
    /** Session ID for follow-up messages */
    sessionId: string;
}

export interface UploadResponse {
    /** Document ID for the uploaded file */
    documentId: string;
    /** Processing status */
    status: "processing" | "ready" | "error";
}

export class Tether {
    private apiKey: string;
    private pluginId: string;
    private baseUrl: string;
    private timeout: number;
    private sessionId?: string;

    constructor(options: TetherOptions) {
        if (!options.apiKey) throw new Error("apiKey is required");
        if (!options.pluginId) throw new Error("pluginId is required");

        this.apiKey = options.apiKey;
        this.pluginId = options.pluginId;
        this.baseUrl = (options.baseUrl || "https://api.tether.dev").replace(
            /\/$/,
            ""
        );
        this.timeout = options.timeout || 30000;
    }

    /**
     * Send a chat message to your SME plugin.
     *
     * @param message - The question or prompt
     * @param options - Optional session ID and override parameters
     * @returns Cited response with RAGAS score
     *
     * @example
     * ```typescript
     * const res = await plug.chat('Analyze clause 4.2 for liability.')
     * console.log(res.text)       // "Based on our analysis..."
     * console.log(res.citations)  // [{ source: "contract.pdf", page: 12 }]
     * console.log(res.verified)   // true
     * ```
     */
    async chat(
        message: string,
        options?: { sessionId?: string }
    ): Promise<ChatResponse> {
        const sessionId = options?.sessionId || this.sessionId;

        const res = await this.request("/v1/chat", {
            method: "POST",
            body: JSON.stringify({
                message,
                plugin_id: this.pluginId,
                session_id: sessionId,
            }),
        });

        const data = await res.json();

        // Store session for follow-ups
        this.sessionId = data.session_id;

        return {
            text: data.response,
            citations: data.citations || [],
            verified: data.verified ?? false,
            ragasScore: data.ragas_score ?? 0,
            sessionId: data.session_id,
        };
    }

    /**
     * Upload a document to the plugin's knowledge base.
     *
     * @param file - File buffer or ReadableStream
     * @param filename - Name of the file
     * @returns Upload status
     */
    async upload(
        file: Buffer | ReadableStream,
        filename: string
    ): Promise<UploadResponse> {
        const formData = new FormData();
        const blob = file instanceof Buffer ? new Blob([file]) : file;
        formData.append("file", blob, filename);
        formData.append("plugin_id", this.pluginId);

        const res = await this.request("/v1/upload", {
            method: "POST",
            body: formData,
            headers: {}, // Let fetch set Content-Type for FormData
        });

        return res.json();
    }

    /**
     * Trigger a re-index of the plugin's knowledge base.
     */
    async reindex(): Promise<{ status: string }> {
        const res = await this.request(`/v1/reindex/${this.pluginId}`, {
            method: "POST",
        });
        return res.json();
    }

    /**
     * Get the RAGAS evaluation scores for this plugin.
     */
    async evaluate(): Promise<{
        faithfulness: number;
        answerRelevancy: number;
        contextPrecision: number;
        overall: number;
    }> {
        const res = await this.request(`/v1/eval/${this.pluginId}`, {
            method: "GET",
        });
        return res.json();
    }

    /** Clear the current session (starts a new conversation) */
    clearSession() {
        this.sessionId = undefined;
    }

    /** Get the current session ID */
    getSessionId(): string | undefined {
        return this.sessionId;
    }

    private async request(
        path: string,
        init: RequestInit & { headers?: Record<string, string> }
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.apiKey}`,
            ...init.headers,
        };

        // Only set Content-Type for JSON bodies; FormData sets its own
        if (typeof init.body === "string") {
            headers["Content-Type"] = "application/json";
        }

        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                ...init,
                headers,
                signal: controller.signal,
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                if (res.status === 401) {
                    throw new TetherError("Invalid API key", "INVALID_KEY", 401);
                }
                if (res.status === 429) {
                    throw new TetherError("Rate limit exceeded", "RATE_LIMITED", 429);
                }
                throw new TetherError(
                    `API error: ${res.status} ${body}`,
                    "API_ERROR",
                    res.status
                );
            }

            return res;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

export class TetherError extends Error {
    code: string;
    status: number;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.name = "TetherError";
        this.code = code;
        this.status = status;
    }
}

export default Tether;
