import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: `file:${path.join(__dirname, "dev.db")}`,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "founder@example.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const existing = await prisma.agency.findFirst({ where: { userId: user.id } });
  if (!existing) {
    // Brand-new user, nothing saved yet — Mission Control state 1.
    await prisma.agency.create({ data: { userId: user.id } });
  }

  console.log("Seeded:", email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
