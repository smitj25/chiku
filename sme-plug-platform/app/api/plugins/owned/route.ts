import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const purchases = await db.purchase.findMany({
            where: { tenantId: session.tenantId, status: "active" },
            select: { pluginId: true },
        });

        const ownedIds = purchases.map((p) => p.pluginId);

        if (ownedIds.length === 0) {
            // Seed defaults for new tenants
            await db.purchase.createMany({
                data: [
                    { tenantId: session.tenantId, pluginId: "legal" },
                    { tenantId: session.tenantId, pluginId: "healthcare" }
                ]
            });
            return NextResponse.json({ owned: ["legal", "healthcare"] });
        }

        return NextResponse.json({ owned: ownedIds });
    } catch (error) {
        console.error("[GET /api/plugins/owned]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
