# Rencana Implementasi: App Shell & Dashboard

## Ikhtisar

Rencana ini mengkonversi desain App Shell & Dashboard menjadi langkah-langkah koding inkremental. Setiap tugas membangun di atas tugas sebelumnya, dimulai dari fondasi infrastruktur (dependensi, utilitas, tipe) lalu naik ke lapisan API, komponen shell, halaman fitur, dan diakhiri dengan property-based test. Tidak ada kode yang tergantung tanpa diintegrasikan ke langkah sebelumnya.

---

## Tugas

- [x] 1. Instalasi dependensi dan konfigurasi Tailwind dark mode
  - [x] 1.1 Instal dependensi `recharts`
    - Jalankan `npm install recharts` di root proyek untuk menambahkan library grafik
    - Verifikasi `recharts` muncul di `dependencies` pada `package.json`
    - _Persyaratan: 4.1_

  - [x] 1.2 Migrasi dark mode ke `@variant dark` di `globals.css`
    - Tambahkan direktif `@import "tailwindcss";` dan `@variant dark (&:where(.dark, .dark *));` di bagian atas `globals.css`
    - Hapus semua aturan CSS `body.dark-mode { ... }` yang ada dan gantikan dengan utilitas Tailwind `dark:` pada komponen yang relevan
    - Pertahankan aturan `@media print` dan `.struk-layout` yang sudah ada
    - _Persyaratan: 6.6, 6.7_

- [x] 2. Utilitas dan tipe TypeScript
  - [x] 2.1 Buat fungsi `generateNamaNormal` di `src/lib/generateNamaNormal.ts`
    - Implementasikan pure function: `export function generateNamaNormal(nama: string): string` yang mengembalikan `nama.toLowerCase().trim().replace(/\s+/g, ' ')`
    - Fungsi ini harus idempoten (memanggil dua kali menghasilkan output yang sama)
    - _Persyaratan: 2.7_

  - [x] 2.2 Buat tipe TypeScript di `src/types/products.ts`
    - Definisikan interface `ProductListItem`, `CreateProductInput`, dan `UpdateProductInput` sesuai spesifikasi desain
    - _Persyaratan: 2.1, 2.2, 2.3, 2.5_

  - [x] 2.3 Buat tipe TypeScript di `src/types/history.ts`
    - Definisikan interface `HistoryInvoice` dan `HistoryInvoiceItem` dengan union type `status: 'OK' | 'NOT_FOUND' | 'AMBIGUOUS'`
    - _Persyaratan: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.4 Buat tipe TypeScript di `src/types/analytics.ts`
    - Definisikan `AnalyticsPeriod`, `AnalyticsBucket`, dan `AnalyticsResponse` sesuai spesifikasi desain
    - _Persyaratan: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Komponen ThemeProvider dan ThemeToggle
  - [x] 3.1 Buat `src/components/ThemeProvider.tsx`
    - Implementasikan Client Component (`'use client'`) dengan `ThemeContext` yang mengekspos `{ theme: Theme, toggle: () => void }`
    - Gunakan `useEffect` untuk membaca `localStorage.getItem('tokomu-theme')` saat mount dan menerapkan/menghapus class `dark` pada `document.documentElement`
    - Implementasikan fungsi `toggle()` yang mengubah tema, menyimpan ke `localStorage` dengan kunci `tokomu-theme`, dan memperbarui class `dark` pada `<html>`
    - Default tema: `'light'` jika tidak ada nilai di `localStorage`
    - _Persyaratan: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 3.2 Buat `src/components/ThemeToggle.tsx`
    - Implementasikan Client Component yang mengonsumsi `ThemeContext` via `useContext`
    - Render tombol/switch yang memanggil `toggle()` saat diklik dan menampilkan label tema saat ini (`'Gelap'` atau `'Terang'`)
    - _Persyaratan: 6.1, 6.2_

- [x] 4. Perbarui `layout.tsx` dan `Header.jsx`
  - [x] 4.1 Perbarui `src/app/layout.tsx`
    - Import `ThemeProvider` dari `@/components/ThemeProvider` dan `BottomTabBar` dari `@/components/BottomTabBar`
    - Hapus import dan penggunaan `Footer`
    - Bungkus konten `<body>` dengan `<ThemeProvider>`
    - Tambahkan `className="pb-20"` pada elemen `<main>` agar konten tidak tertutup `BottomTabBar`
    - Tambahkan `<BottomTabBar />` di dalam `<ThemeProvider>` setelah `<main>`
    - _Persyaratan: 1.1, 1.5, 6.7_

  - [x] 4.2 Perbarui `src/components/Header.jsx`
    - Tambahkan `<Link href="/settings">Settings</Link>` di dalam `.nav-links` setelah tautan "About" yang sudah ada
    - _Persyaratan: 5.1, 5.2_

- [x] 5. Buat komponen `BottomTabBar`
  - [x] 5.1 Buat `src/components/BottomTabBar.tsx`
    - Implementasikan Client Component (`'use client'`) yang mengimpor `usePathname` dari `next/navigation`
    - Definisikan array `TABS` dengan 4 tab: `{ href: '/invoice', label: 'Record', Icon: Mic }`, `{ href: '/products', label: 'Products', Icon: Package }`, `{ href: '/history', label: 'History', Icon: History }`, `{ href: '/analytics', label: 'Analytics', Icon: BarChart2 }` — impor ikon dari `lucide-react`
    - Tentukan tab aktif dengan `pathname === tab.href` (kecocokan eksak); jika pathname tidak cocok mana pun, tidak ada tab yang aktif
    - Render sebagai `<nav>` dengan kelas `fixed bottom-0 w-full` dan tampilkan ikon + label teks untuk setiap tab
    - Terapkan kelas berbeda untuk state aktif vs. tidak aktif (misalnya `text-blue-600 dark:text-blue-400` vs. `text-gray-500 dark:text-gray-400`)
    - Terapkan desain responsif dengan breakpoint Tailwind untuk mobile, tablet, dan desktop
    - _Persyaratan: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

- [x] 6. Halaman Settings
  - [x] 6.1 Buat `src/app/settings/page.tsx`
    - Implementasikan sebagai Server Component yang me-render `ThemeToggle` dan judul halaman "Pengaturan"
    - Sertakan deskripsi singkat tentang opsi tema yang tersedia
    - _Persyaratan: 5.3, 5.4, 6.1_

- [x] 7. Checkpoint — Verifikasi shell dan tema
  - Pastikan `npm run build` berhasil tanpa error TypeScript
  - Verifikasi `ThemeProvider`, `BottomTabBar`, `Header` (dengan Settings), dan `Settings` page terpasang benar di browser
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum lanjut ke API

- [x] 8. API: Endpoint Products (POST, GET list, PUT, DELETE)
  - [x] 8.1 Perbarui `src/app/api/products/route.ts` — tambah handler `POST` dan `GET` list semua produk
    - Tambahkan handler `POST`: validasi body dengan Zod `CreateProductSchema` (`nama: z.string().min(1).trim()`, `harga: z.number().int().positive()`, `stok: z.number().int().min(0)`), panggil `generateNamaNormal(nama)` untuk mengisi field `namaNormal`, simpan ke Prisma, kembalikan 201 dengan produk yang dibuat
    - Modifikasi handler `GET` yang ada: jika query param `?q=` tidak ada atau kosong, kembalikan semua produk diurutkan berdasarkan `nama` (untuk halaman Products); jika `?q=` ada, jalankan logika fuzzy search yang sudah ada
    - Terapkan pola error handler standar: Zod → 400, error DB → 500
    - _Persyaratan: 7.1, 7.2, 7.5, 7.6_

  - [x] 8.2 Buat `src/app/api/products/[id]/route.ts` — handler `PUT` dan `DELETE`
    - Handler `PUT`: validasi body dengan Zod `UpdateProductSchema` (semua field opsional), perbarui produk di Prisma; jika `nama` ada dalam body, regenerasi `namaNormal` otomatis; kembalikan 200 dengan produk yang diperbarui atau 404 jika tidak ditemukan
    - Handler `DELETE`: hapus produk berdasarkan `id`; kembalikan 200 dengan `{ "message": "Produk berhasil dihapus" }` atau 404 jika tidak ditemukan
    - Terapkan pola error handler standar termasuk pengecekan Prisma error `P2025` untuk 404
    - _Persyaratan: 7.2, 7.5, 7.6_

- [x] 9. API: Endpoint History dan Analytics
  - [x] 9.1 Buat `src/app/api/history/route.ts`
    - Handler `GET`: ambil semua invoice dengan `prisma.invoice.findMany({ orderBy: { tanggalWaktu: 'desc' }, include: { items: true } })`
    - Kembalikan `{ invoices: HistoryInvoice[], total: number }` dengan status 200
    - Terapkan pola error handler standar untuk error DB
    - _Persyaratan: 7.3, 3.1, 3.2, 3.3_

  - [x] 9.2 Buat fungsi pure `groupByPeriod` dan handler `GET /api/analytics`
    - Buat fungsi pure `groupByPeriod(invoices: Array<{ tanggalWaktu: Date; totalKeseluruhan: number }>, period: AnalyticsPeriod): AnalyticsBucket[]` yang mengelompokkan invoice berdasarkan label bucket (`'YYYY-MM-DD'` untuk day, `'YYYY-WNN'` untuk week, `'YYYY-MM'` untuk month) tanpa menggunakan raw SQL
    - Buat `src/app/api/analytics/route.ts`: validasi query param `period` (harus `day` | `week` | `month`, kembalikan 400 jika tidak valid), tentukan `startDate` berdasarkan periode (30 hari / 12 minggu / 12 bulan terakhir), ambil invoice dari Prisma dalam rentang tersebut, panggil `groupByPeriod`, hitung `summary`, kembalikan `AnalyticsResponse` dengan status 200
    - _Persyaratan: 7.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_

- [x] 10. Halaman Products — CRUD UI
  - [x] 10.1 Buat `src/app/products/page.tsx`
    - Implementasikan Client Component dengan state: `products: ProductListItem[]`, `loading: boolean`, `error: string | null`, `modalMode: 'add' | 'edit' | null`, `selectedProduct: ProductListItem | null`, `deleteConfirm: string | null`
    - `useEffect` pada mount: panggil `GET /api/products` (tanpa `?q=`) dan isi state `products`; tampilkan spinner/skeleton saat `loading === true`
    - Render daftar produk: nama, harga (format Rupiah via `formatCurrency`), stok untuk setiap produk
    - Render tombol "Tambah Produk", tombol "Edit" dan "Hapus" per baris produk
    - _Persyaratan: 2.1, 2.2, 2.8_

  - [x] 10.2 Implementasikan modal form tambah/edit di `src/app/products/page.tsx`
    - Render overlay modal dengan form field: `nama` (string), `harga` (number), `stok` (number)
    - Validasi sisi klien sebelum submit: `nama` tidak boleh kosong/hanya whitespace, `harga` harus bilangan bulat > 0, `stok` harus bilangan bulat ≥ 0; tampilkan pesan kesalahan per field jika gagal
    - Mode `'add'`: submit memanggil `POST /api/products`; mode `'edit'`: submit memanggil `PUT /api/products/[id]`
    - Setelah operasi sukses, tutup modal dan refresh daftar produk
    - _Persyaratan: 2.3, 2.4, 2.5, 2.7_

  - [x] 10.3 Implementasikan konfirmasi hapus di `src/app/products/page.tsx`
    - Saat tombol "Hapus" diklik, set `deleteConfirm = id` dan tampilkan dialog konfirmasi (misalnya alert modal atau inline confirmation)
    - Jika dikonfirmasi, panggil `DELETE /api/products/[id]` dan refresh daftar; jika dibatalkan, reset `deleteConfirm = null`
    - _Persyaratan: 2.6_

- [x] 11. Halaman History — Accordion List
  - [x] 11.1 Buat `src/app/history/page.tsx`
    - Implementasikan Client Component dengan state: `invoices: HistoryInvoice[]`, `loading: boolean`, `error: string | null`, `expandedId: string | null`
    - `useEffect` pada mount: panggil `GET /api/history` dan isi state; tampilkan spinner saat loading
    - Render ringkasan jumlah transaksi di atas daftar
    - Jika `invoices` kosong, tampilkan pesan empty state yang informatif (misalnya "Belum ada transaksi yang tersimpan.")
    - _Persyaratan: 3.1, 3.5, 3.6_

  - [x] 11.2 Implementasikan accordion dan styling NOT_FOUND di `src/app/history/page.tsx`
    - Render setiap invoice sebagai baris yang dapat di-expand: tampilkan nomor invoice, tanggal/waktu (format lokal Indonesia), total keseluruhan (format Rupiah)
    - Saat diklik, toggle `expandedId`; jika expanded, tampilkan daftar item dalam transaksi
    - Setiap item menampilkan: nama barang, kuantitas, harga satuan, subtotal
    - Item dengan `status === 'NOT_FOUND'` dirender dengan kelas `text-red-500` dan badge label "Tidak Ditemukan"
    - _Persyaratan: 3.2, 3.3, 3.4_

- [x] 12. Halaman Analytics — Grafik dan Statistik
  - [x] 12.1 Buat `src/app/analytics/page.tsx` — toggle periode dan fetch data
    - Implementasikan Client Component dengan state: `period: AnalyticsPeriod` (default `'day'`), `data: AnalyticsResponse | null`, `loading: boolean`, `error: string | null`
    - Render tiga tombol toggle periode: "Per Hari", "Per Minggu", "Per Bulan"; tombol aktif memiliki styling berbeda
    - `useEffect` yang bergantung pada `period`: panggil `GET /api/analytics?period={period}` setiap kali `period` berubah; tampilkan spinner saat loading
    - Tampilkan ringkasan statistik: total pendapatan dan jumlah transaksi dari `data.summary`
    - Jika `data.buckets` kosong, tampilkan pesan "Tidak ada data transaksi untuk periode ini."
    - _Persyaratan: 4.1, 4.5, 4.6, 4.7_

  - [x] 12.2 Implementasikan `BarChart` Recharts di `src/app/analytics/page.tsx`
    - Import `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` dari `recharts`
    - Umpankan `data.buckets` langsung ke prop `data` pada `BarChart` dengan `dataKey="totalPendapatan"` untuk batang dan `dataKey="label"` untuk sumbu X
    - Bungkus dalam `<ResponsiveContainer width="100%" height={300}>` agar responsif
    - _Persyaratan: 4.1, 4.2, 4.3, 4.4_

- [x] 13. Checkpoint — Verifikasi seluruh fitur
  - Pastikan semua halaman (`/products`, `/history`, `/analytics`, `/settings`) dapat diakses via `BottomTabBar`
  - Pastikan `npm run build` berhasil tanpa error TypeScript
  - Tanyakan kepada pengguna jika ada pertanyaan sebelum lanjut ke property tests

- [x] 14. Property-Based Tests
  - [x] 14.1 Buat file test dan tulis Property 1 — Invariant Active Tab
    - Buat `src/__tests__/app-shell-dashboard.test.ts` (atau `.spec.ts`) dengan setup `@fast-check/vitest`
    - Tulis property test: untuk semua string `pathname` yang dibangkitkan secara acak, hitung jumlah tab dari array `TABS` yang cocok dengan `pathname === tab.href`; assert jumlahnya ≤ 1
    - Anotasi: `// Feature: app-shell-dashboard, Property 1: paling banyak satu tab aktif pada satu waktu`
    - _Persyaratan: 1.3_

  - [x] 14.2 Tulis Property 2 — `generateNamaNormal` menghasilkan output konsisten
    - Gunakan `fc.string()` sebagai arbitrary untuk `nama`
    - Assert: (a) output seluruhnya lowercase, (b) tidak ada whitespace di awal/akhir (`result === result.trim()`), (c) tidak ada whitespace berurutan di tengah (`!/\s{2,}/.test(result)`), (d) idempoten: `generateNamaNormal(generateNamaNormal(nama)) === generateNamaNormal(nama)`
    - Anotasi: `// Feature: app-shell-dashboard, Property 2: generateNamaNormal menghasilkan output konsisten`
    - _Persyaratan: 2.7_

  - [x] 14.3 Tulis Property 3 — Validasi input produk menolak semua input invalid
    - Buat tiga sub-properti dengan arbitrary berbeda: (a) `nama` kosong/whitespace-only + `harga` positif + `stok` non-negatif → `safeParse.success === false`, (b) `nama` valid + `harga ≤ 0` → `safeParse.success === false`, (c) `nama` valid + `harga` positif + `stok < 0` → `safeParse.success === false`
    - Import `CreateProductSchema` (Zod schema) dari lokasi yang sesuai
    - Anotasi: `// Feature: app-shell-dashboard, Property 3: validasi menolak semua input invalid`
    - _Persyaratan: 2.4, 7.5_

  - [x] 14.4 Tulis Property 4 — `formatCurrency` menghasilkan format Rupiah yang valid
    - Gunakan `fc.integer({ min: 0, max: 1_000_000_000 })` sebagai arbitrary
    - Assert: (a) output dimulai dengan `"Rp "`, (b) tidak mengandung titik desimal, (c) `formatCurrency(1000) === "Rp 1.000"` sebagai contoh spesifik
    - Anotasi: `// Feature: app-shell-dashboard, Property 4: formatCurrency menghasilkan format Rupiah yang valid`
    - _Persyaratan: 2.2, 3.2_

  - [x] 14.5 Tulis Property 5 — Pengurutan riwayat bersifat deterministik dan tidak ada data hilang
    - Buat arbitrary untuk array `Invoice` dengan `tanggalWaktu` acak menggunakan `fc.array(fc.record({ tanggalWaktu: fc.date(), totalKeseluruhan: fc.nat() }))`
    - Sort array menggunakan logika yang sama dengan `GET /api/history`; assert: panjang output sama dengan input, dan `output[i].tanggalWaktu >= output[i+1].tanggalWaktu` untuk semua `i`
    - Anotasi: `// Feature: app-shell-dashboard, Property 5: pengurutan riwayat deterministik dan tidak ada data hilang`
    - _Persyaratan: 3.1_

  - [x] 14.6 Tulis Property 6 — Agregasi analytics memenuhi sum invariant
    - Import fungsi `groupByPeriod` dari lokasi implementasinya
    - Buat arbitrary `fc.array(fc.record({ tanggalWaktu: fc.date(), totalKeseluruhan: fc.nat() }))` dan `fc.constantFrom<AnalyticsPeriod>('day', 'week', 'month')`
    - Assert: `sum(buckets.map(b => b.totalPendapatan)) === sum(invoices.map(i => i.totalKeseluruhan))` — tidak ada rupiah yang hilang atau terhitung ganda
    - Anotasi: `// Feature: app-shell-dashboard, Property 6: groupByPeriod memenuhi sum invariant`
    - _Persyaratan: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 14.7 Tulis Property 7 — Tema round-trip dan konsistensi class HTML
    - Mock `localStorage` dan `document.documentElement.classList` menggunakan vitest mock (`vi.stubGlobal`)
    - Untuk setiap nilai awal tema (`'light'` dan `'dark'`), simulasikan dua panggilan `toggle()`; assert tema kembali ke nilai awal
    - Assert: setelah setiap toggle, `localStorage.getItem('tokomu-theme')` konsisten dengan `document.documentElement.classList.contains('dark')`
    - Anotasi: `// Feature: app-shell-dashboard, Property 7: tema round-trip dan konsistensi class HTML`
    - _Persyaratan: 6.2, 6.3, 6.6_

- [x] 15. Checkpoint Akhir — Semua test dan build
  - Jalankan `npx vitest --run` untuk memverifikasi semua property test lulus
  - Pastikan `npm run build` berhasil tanpa error
  - Tanyakan kepada pengguna jika ada pertanyaan

---

## Catatan

- Tugas bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap tugas merujuk ke persyaratan spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental sebelum melanjutkan ke lapisan berikutnya
- Property tests memvalidasi properti kebenaran universal; unit tests memvalidasi contoh dan kasus tepi spesifik
- Fungsi `groupByPeriod` harus diekspor dari file utilitas terpisah agar dapat diimpor oleh file test
- Endpoint `GET /api/products?q=` yang sudah ada (untuk fuzzy search invoice) tidak boleh diubah perilakunya saat `?q=` ada — hanya ditambahkan behavior listing semua produk saat `?q=` kosong/tidak ada

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["4.1", "4.2", "5.1"] },
    { "id": 4, "tasks": ["6.1", "8.1", "8.2", "9.1", "9.2"] },
    { "id": 5, "tasks": ["10.1", "11.1", "12.1"] },
    { "id": 6, "tasks": ["10.2", "10.3", "11.2", "12.2"] },
    { "id": 7, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7"] }
  ]
}
```
