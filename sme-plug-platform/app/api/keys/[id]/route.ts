// app/api/keys/[id]/route.ts — Revoke an API key by ID
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "sme-plug-dev-secret-change-in-production"
);

async function getTenant(req: NextRequest) {
    const token = req.cookies.get("sme_session")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: string; tenantId: string };
    } catch {
        return null;
    }
}

// DELETE /api/keys/{id} — revoke a key
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const tenant = await getTenant(req);
    if (!tenant) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Ensure the key belongs to this tenant
    const key = await db.apiKey.findFirst({
        where: { id, tenantId: tenant.tenantId },
    });

    if (!key) {
        return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    await db.apiKey.update({
        where: { id },
        data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: `Key ${id} revoked` });
}
