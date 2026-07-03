import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Local-dev stand-in (SQLite via a driver adapter) per 02_TECH_ARCHITECTURE.md.
// Swap the adapter for a Postgres one when moving to Supabase.
const adapter = new PrismaBetterSqlite3({
  url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
