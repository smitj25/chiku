import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Group by plugId to get total calls and last used date
        const usageData = await db.apiCall.groupBy({
            by: ["plugId"],
            where: { tenantId: session.tenantId },
            _count: { id: true },
            _max: { createdAt: true },
        });

        // Convert the Prisma result to a nicer format: { [plugId]: { calls, lastUsed } }
        const formattedUsage = usageData.reduce((acc, item) => {
            acc[item.plugId] = {
                calls: item._count.id,
                lastUsed: item._max.createdAt,
            };
            return acc;
        }, {} as Record<string, { calls: number; lastUsed: Date | null }>);

        return NextResponse.json({ usage: formattedUsage });
    } catch (error) {
        console.error("[GET /api/plugins/usage]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
