import * as vscode from "vscode";

interface ChatResponse {
    response: string;
    citations: { source: string; page: number; relevance: number }[];
    verified: boolean;
    ragas_score: number;
    session_id: string;
}

export class SMEPlugClient {
    private getConfig() {
        const config = vscode.workspace.getConfiguration("smeplug");
        return {
            apiKey: config.get<string>("apiKey", ""),
            pluginId: config.get<string>("pluginId", "legal-v1"),
            apiUrl: config.get<string>("apiUrl", "https://api.smeplug.dev"),
            stream: config.get<boolean>("streamResponses", true),
        };
    }

    isConfigured(): boolean {
        return !!this.getConfig().apiKey;
    }

    async chat(message: string, sessionId?: string): Promise<ChatResponse> {
        const { apiKey, pluginId, apiUrl } = this.getConfig();

        if (!apiKey) {
            throw new Error(
                "API key not set. Run 'SME-Plug: Set API Key' to configure."
            );
        }

        const res = await fetch(`${apiUrl}/v1/chat`, {
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
            const errorBody = await res.text().catch(() => "Unknown error");
            if (res.status === 401) {
                throw new Error("Invalid API key. Check your key at smeplug.dev/api-keys");
            }
            if (res.status === 429) {
                throw new Error("Rate limit exceeded. Upgrade your plan at smeplug.dev/billing");
            }
            throw new Error(`API error ${res.status}: ${errorBody}`);
        }

        return res.json() as Promise<ChatResponse>;
    }
}
