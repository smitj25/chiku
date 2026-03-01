const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const plugins = await prisma.plugin.findMany();
  console.log(plugins);
}
main().catch(console.error).finally(() => prisma.$disconnect());
