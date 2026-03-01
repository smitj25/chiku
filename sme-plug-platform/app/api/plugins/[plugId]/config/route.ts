import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ plugId: string }> }
) {
    try {
        const { plugId } = await params;
        const session = await verifySession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const config = await prisma.pluginConfig.findFirst({
            where: {
                tenantId: session.tenantId,
                pluginId: plugId,
            },
        });

        if (!config) {
            return NextResponse.json({ config: null });
        }

        return NextResponse.json({
            config: {
                ...config,
                decisionTree: JSON.parse(config.decisionTree),
                guardrails: JSON.parse(config.guardrails),
            }
        });
    } catch (error) {
        console.error("Failed to fetch plugin config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ plugId: string }> }
) {
    try {
        const { plugId } = await params;
        const session = await verifySession();
        if (!session || !session.tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { persona, decisionTree, guardrails } = body;

        if (!persona || !Array.isArray(decisionTree) || !guardrails) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Upsert the configuration (Prisma missing unique compound index, so doing a find/update or create)
        let config = await prisma.pluginConfig.findFirst({
            where: {
                tenantId: session.tenantId,
                pluginId: plugId,
            },
        });

        if (config) {
            config = await prisma.pluginConfig.update({
                where: { id: config.id },
                data: {
                    persona,
                    decisionTree: JSON.stringify(decisionTree),
                    guardrails: JSON.stringify(guardrails),
                },
            });
        } else {
            // Check if the plugin exists. If yes use its inner id, if it's external reference to string plugId we need to handle that.
            // Wait, Plugin schema uses string ID? Let's check if the plugin exists in the Plugin table.

            // "plugId" usually looks like "legal-v1". Wait, the `pluginId` field in `PluginConfig` references `Plugin.id`.
            // Let's ensure a Plugin record exists, but for the MVP, the plugins are seeded with IDs matching `plugId`.

            config = await prisma.pluginConfig.create({
                data: {
                    tenantId: session.tenantId,
                    pluginId: plugId,
                    persona,
                    decisionTree: JSON.stringify(decisionTree),
                    guardrails: JSON.stringify(guardrails),
                },
            });
        }

        return NextResponse.json({ success: true, config });

    } catch (error) {
        console.error("Failed to save plugin config:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
