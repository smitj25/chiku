// app/api/keys/route.ts — Real API key generation using crypto + Prisma
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "sme-plug-dev-secret-change-in-production"
);

// Helper: extract tenant from JWT cookie
async function getTenant(req: NextRequest) {
    const token = req.cookies.get("sme_session")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: string; tenantId: string; email: string; plan: string };
    } catch {
        return null;
    }
}

// ── GET: List all keys for the authenticated tenant ──────────────────────────
export async function GET(req: NextRequest) {
    const tenant = await getTenant(req);
    if (!tenant) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db.apiKey.findMany({
        where: { tenantId: tenant.tenantId },
        select: {
            id: true,
            name: true,
            pluginId: true,
            prefix: true,
            createdAt: true,
            lastUsed: true,
            revokedAt: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
}

// ── POST: Generate a new API key ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const tenant = await getTenant(req);
    if (!tenant) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, pluginId } = await req.json();

        if (!name || !pluginId) {
            return NextResponse.json(
                { error: "name and pluginId are required" },
                { status: 400 }
            );
        }

        // 1. Generate cryptographically secure key
        const rawBytes = randomBytes(32).toString("hex");       // 64 hex chars
        const fullKey = `sme_live_${rawBytes}`;                 // sme_live_ + 64 chars
        const keyHash = createHash("sha256").update(fullKey).digest("hex");
        const prefix = `sme_live_${rawBytes.slice(0, 8)}...`;  // visible in UI forever

        // 2. Store ONLY hash + prefix in database
        await db.apiKey.create({
            data: {
                tenantId: tenant.tenantId,
                pluginId,
                name,
                keyHash,
                prefix,
            },
        });

        // 3. Return full key ONCE — never stored, never returned again
        return NextResponse.json(
            {
                key: fullKey,
                prefix,
                pluginId,
                name,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Key generation error:", err);
        return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
    }
}
