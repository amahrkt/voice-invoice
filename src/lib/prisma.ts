import { PrismaClient } from "@/generated/prisma/client";

// Reuse the same PrismaClient instance across hot reloads in development.
// In production a fresh instance is created once per process.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
