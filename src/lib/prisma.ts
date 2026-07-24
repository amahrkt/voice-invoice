import { PrismaClient } from "@/generated/prisma/client";

// Reuse the same PrismaClient instance across hot reloads in development.
// In production a fresh instance is created once per process.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Kembalikan ke {} as any untuk membungkam paksaan TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = globalForPrisma.prisma ?? new PrismaClient({} as any);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;