import { PrismaClient } from "@prisma/client";
import { ALL_PLUGS } from "../lib/data";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding plugins...");
    for (const plug of ALL_PLUGS) {
        await prisma.plugin.upsert({
            where: { slug: plug.id },
            update: {
                name: plug.name,
                domain: plug.domain,
                description: plug.tags.join(", "),
                color: plug.color,
                price: plug.price,
                ragasScore: plug.score,
            },
            create: {
                // Here we set the `id` to `plug.id` to match existing foreign keys!
                id: plug.id,
                slug: plug.id,
                name: plug.name,
                domain: plug.domain,
                description: plug.tags.join(", "),
                color: plug.color,
                price: plug.price,
                ragasScore: plug.score,
            },
        });
    }
    console.log("Plugins seeded.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
