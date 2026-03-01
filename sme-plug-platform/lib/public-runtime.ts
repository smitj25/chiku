const backendBaseUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
).replace(/\/$/, "");

const demoApiKey = process.env.NEXT_PUBLIC_DEMO_API_KEY || "dev-test-key-123";

export const publicRuntime = {
    backendBaseUrl,
    demoApiKey,
};

export function backendUrl(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${backendBaseUrl}${normalizedPath}`;
}

