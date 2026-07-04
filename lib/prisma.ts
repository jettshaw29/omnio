import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Postgres via Supabase, per 02_TECH_ARCHITECTURE.md. Supabase's pooler
// presents a chain rooted in Supabase's own private CA (not a publicly
// trusted one), which Node's default trust store rejects outright — this
// pins that CA explicitly rather than disabling verification, so the
// connection is both encrypted and actually chain-verified. Extracted
// straight from the pooler's live TLS handshake (lib/certs/supabase-ca.pem);
// re-extract if Supabase ever rotates it.
const ca = fs.readFileSync(
  path.join(process.cwd(), "lib", "certs", "supabase-ca.pem"),
  "utf-8"
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { ca, rejectUnauthorized: true },
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
