import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await verifySession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const plugins = await db.plugin.findMany({
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ plugins });
    } catch (error) {
        console.error("[GET /api/plugins]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
