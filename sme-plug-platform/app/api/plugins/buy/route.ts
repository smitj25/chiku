import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { plugId } = body;

        if (!plugId) {
            return NextResponse.json({ error: "Missing plugId" }, { status: 400 });
        }

        // Upsert purchase
        const purchase = await db.purchase.findFirst({
            where: { tenantId: session.tenantId, pluginId: plugId },
        });

        if (purchase) {
            return NextResponse.json({ message: "Already owned", owned: [plugId] });
        }

        await db.purchase.create({
            data: {
                tenantId: session.tenantId,
                pluginId: plugId,
                status: "active"
            }
        });

        // Trigger refetch of all owned
        const allPurchases = await db.purchase.findMany({
            where: { tenantId: session.tenantId, status: "active" },
        });

        return NextResponse.json({
            owned: allPurchases.map((p) => p.pluginId),
        });
    } catch (error) {
        console.error("[POST /api/plugins/buy]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
