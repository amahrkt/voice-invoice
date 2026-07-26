import 'dotenv/config'; 
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Inisialisasi adapter mandiri khusus untuk runtime seed luar Next.js
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL tidak ditemukan di file .env!");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Sedang membersihkan data lama (jika ada)...');
  await prisma.product.deleteMany({});

  console.log('Sedang memasukkan data contoh produk... 🚀');

  const produkContoh = [
    { nama: 'Beras Premium 5kg', namaNormal: 'beras premium 5kg', harga: 75000, stok: 50 },
    { nama: 'Minyak Goreng 2L', namaNormal: 'minyak goreng 2l', harga: 36000, stok: 40 },
    { nama: 'Gula Pasir 1kg', namaNormal: 'gula pasir 1kg', harga: 18000, stok: 100 },
    { nama: 'Telur Ayam 1kg', namaNormal: 'telur ayam 1kg', harga: 28000, stok: 30 },
    { nama: 'Mie Instan Goreng', namaNormal: 'mie instan goreng', harga: 3500, stok: 200 },
    { nama: 'Kopi Bubuk 200g', namaNormal: 'kopi bubuk 200g', harga: 15000, stok: 60 },
  ];

  for (const p of produkContoh) {
    const produk = await prisma.product.create({
      data: p,
    });
    console.log(`✓ Berhasil menambahkan produk: ${p.nama} - Rp${p.harga}`);
  }

  console.log('🎉 Proses seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Tutup pool koneksi database secara bersih
  });