import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.appMetadata.upsert({
    where: { key: 'bootstrap' },
    update: { value: 'milestone-1' },
    create: { key: 'bootstrap', value: 'milestone-1' },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });