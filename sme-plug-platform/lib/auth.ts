// lib/auth.ts — JWT authentication utilities
// Uses 'jose' for edge-compatible JWT signing/verification

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "sme-plug-dev-secret-change-in-production"
);

const TOKEN_NAME = "sme_session";
const TOKEN_EXPIRY = "24h";

export interface SessionPayload extends JWTPayload {
    userId: string;
    tenantId: string;
    email: string;
    plan: string;
}

/** Create a signed JWT and set it as an httpOnly cookie */
export async function createSession(payload: Omit<SessionPayload, "iat" | "exp">) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(TOKEN_EXPIRY)
        .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set(TOKEN_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
    });

    return token;
}

/** Verify the session cookie and return the payload */
export async function verifySession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as SessionPayload;
    } catch {
        return null;
    }
}

/** Clear the session cookie */
export async function destroySession() {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_NAME);
}

/** Hash a password using Web Crypto API (edge-compatible) */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/** Verify a password against a hash */
export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

/** Hash an API key for storage (never store plaintext) */
export async function hashApiKey(key: string): Promise<string> {
    return hashPassword(key); // Same SHA-256 approach
}
