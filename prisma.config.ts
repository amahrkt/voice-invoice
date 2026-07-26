// Prisma 7 config — connection URL goes here, not in schema.prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts", // 💡 KUNCI: Tambahkan baris ini di sini
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "",
  },
});