import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Reuse the same PrismaClient instance across hot reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 1. Setup adapter untuk Prisma 7 (Mengambil URL dari .env)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Masukkan adapter tersebut ke dalam instance PrismaClient
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Tetap menggunakan export default seperti gaya kode awal Anda
export default prisma;