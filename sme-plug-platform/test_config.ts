import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const config = await prisma.pluginConfig.findMany();
    console.log(JSON.stringify(config, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
