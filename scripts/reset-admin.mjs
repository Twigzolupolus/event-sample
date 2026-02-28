import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.adminCredential.deleteMany({ where: { id: "singleton" } });
  console.log(`Admin credential reset complete. Rows deleted: ${result.count}`);
}

main()
  .catch((err) => {
    console.error("Failed to reset admin credential:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
