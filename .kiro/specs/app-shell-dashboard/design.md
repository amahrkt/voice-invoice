
# Dokumen Desain: App Shell & Dashboard

## Ikhtisar

Fitur ini mengembangkan aplikasi Tokomu dari shell sederhana (Header + main + Footer) menjadi aplikasi kasir berfitur lengkap dengan navigasi tab bawah, manajemen produk, riwayat transaksi, grafik analitik, dan sistem tema dark/light. Seluruh perubahan dibangun di atas tumpukan yang sudah ada: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma v7, dan PostgreSQL.

Perubahan inti pada shell:
- `Footer` dihapus dari layout utama; ruang bawah kini ditempati `BottomTabBar`.
- `ThemeProvider` (Client Component) membungkus seluruh `<body>` untuk mendistribusikan state tema.
- Kelas dark-mode pada `<body>` (sistem lama di `globals.css`) dimigrasikan ke kelas `dark` pada `<html>` sesuai strategi Tailwind CSS.

---

## Arsitektur

### Strategi Tailwind Dark Mode

Tailwind CSS v4 mendukung konfigurasi `darkMode: 'class'` melalui CSS custom property. File `globals.css` perlu ditambahkan direktif berikut, dan semua aturan `body.dark-mode` lama dimigrasikan ke utilitas Tailwind `dark:`:

```css
/* globals.css — tambahkan di bagian atas */
@import "tailwindcss";
@variant dark (&:where(.dark, .dark *));
```

Dengan ini, setiap komponen dapat menggunakan `dark:bg-gray-900`, `dark:text-white`, dll. tanpa bergantung pada kelas `body.dark-mode`.

### Gambaran Umum Alur Data

```
Browser
  └── ThemeProvider (Client, baca/tulis localStorage "tokomu-theme")
        └── <html class="dark|"> (kontrol Tailwind dark mode)
              ├── Header (Server Component, tambah link Settings)
              ├── <main> {children} (halaman masing-masing)
              └── BottomTabBar (Client Component, usePathname)
```

### Diagram Hirarki Komponen

```
src/
├── app/
│   ├── layout.tsx              ← wrap ThemeProvider, hapus Footer, tambah BottomTabBar
│   ├── page.tsx                (tidak berubah)
│   ├── about/page.jsx          (tidak berubah)
│   ├── invoice/page.tsx        (tidak berubah, rute Tab_Record)
│   ├── products/
│   │   └── page.tsx            ← BARU: halaman manajemen produk
│   ├── history/
│   │   └── page.tsx            ← BARU: halaman riwayat transaksi
│   ├── analytics/
│   │   └── page.tsx            ← BARU: halaman grafik penjualan
│   ├── settings/
│   │   └── page.tsx            ← BARU: halaman pengaturan tema
│   └── api/
│       ├── products/
│       │   ├── route.ts        ← tambah POST handler
│       │   └── [id]/
│       │       └── route.ts    ← BARU: PUT + DELETE
│       ├── history/
│       │   └── route.ts        ← BARU: GET riwayat invoice
│       └── analytics/
│           └── route.ts        ← BARU: GET agregat per periode
├── components/
│   ├── Header.jsx              ← tambah link Settings
│   ├── Footer.jsx              (tidak digunakan di layout, tetap ada)
│   ├── BottomTabBar.tsx        ← BARU: navigasi tab bawah
│   ├── ThemeProvider.tsx       ← BARU: context tema global
│   ├── ThemeToggle.tsx         ← BARU: switch dark/light di Settings
│   └── invoice/                (tidak berubah)
└── lib/
    └── generateNamaNormal.ts   ← BARU: ekstrak logika normalisasi nama produk
```

---

## Komponen dan Antarmuka

### 1. `ThemeProvider` (`src/components/ThemeProvider.tsx`)

Komponen Client yang membaca `localStorage["tokomu-theme"]` saat mount, menerapkan/menghapus kelas `dark` pada `document.documentElement`, dan menyediakan context untuk `ThemeToggle`.

```tsx
'use client';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('tokomu-theme') as Theme | null;
    const initial = stored ?? 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('tokomu-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Alasan desain:** Menggunakan `useEffect` untuk menghindari hydration mismatch — server tidak bisa membaca `localStorage`. Kelas `dark` pada `<html>` dikelola langsung (bukan via state React) agar perubahan tema bersifat instan tanpa re-render tree.

### 2. `BottomTabBar` (`src/components/BottomTabBar.tsx`)

Komponen Client yang menggunakan `usePathname()` dari `next/navigation` untuk menentukan tab aktif.

```tsx
'use client';

const TABS = [
  { href: '/invoice',   label: 'Record',    Icon: Mic        },
  { href: '/products',  label: 'Products',  Icon: Package    },
  { href: '/history',   label: 'History',   Icon: History    },
  { href: '/analytics', label: 'Analytics', Icon: BarChart2  },
] as const;
```

Tab aktif ditentukan oleh `pathname === tab.href` (kecocokan eksak, bukan prefix). Komponen di-render sebagai `<nav>` dengan `position: fixed; bottom: 0` melalui kelas Tailwind `fixed bottom-0`.

**Aturan active state:** Tepat satu tab boleh aktif pada satu waktu; jika pathname tidak cocok dengan tab mana pun (mis. di `/about`), tidak ada tab yang aktif.

### 3. Perubahan `layout.tsx`

```tsx
// src/app/layout.tsx
import { ThemeProvider } from '@/components/ThemeProvider';
import { BottomTabBar } from '@/components/BottomTabBar';
import Header from '@/components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <Header />
          <main className="pb-20">{children}</main>
          <BottomTabBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

`pb-20` (padding-bottom 5rem) pada `<main>` memastikan konten tidak tertutup oleh `BottomTabBar` yang fixed.

### 4. `Header.jsx` — Penambahan Link Settings

Menambahkan `<Link href="/settings">Settings</Link>` di dalam `.nav-links`, setelah "About".

### 5. `ThemeToggle` (`src/components/ThemeToggle.tsx`)

Komponen Client yang mengonsumsi `ThemeContext` dan merender tombol toggle. Digunakan di `settings/page.tsx`.

### 6. Halaman Products (`src/app/products/page.tsx`)

Client Component yang mengelola state lokal:

```
state: {
  products: Product[]
  loading: boolean
  error: string | null
  modalMode: 'add' | 'edit' | null
  selectedProduct: Product | null
  deleteConfirm: string | null  // id produk yang akan dihapus
}
```

**Pola fetch:** `useEffect` pada mount memanggil `GET /api/products-list` (endpoint listing baru, bukan yang existing yang memerlukan `?q=`). Setelah operasi mutasi (POST/PUT/DELETE), list di-refresh.

> **Catatan:** Endpoint `GET /api/products?q=` yang sudah ada digunakan untuk fuzzy search invoice; jangan diubah. Untuk listing semua produk, endpoint baru `GET /api/products-list` atau parameter kosong pada endpoint yang sudah ada harus ditambahkan.

**Modal form:** Formulir tambah/edit dirender sebagai overlay modal. Field yang diinput pengguna: `nama` (string), `harga` (number), `stok` (number). Field `namaNormal` di-generate otomatis di sisi server.

**Validasi klien (sebelum submit):**
- `nama`: tidak boleh kosong atau hanya whitespace
- `harga`: harus bilangan bulat positif (> 0)
- `stok`: harus bilangan bulat non-negatif (≥ 0)

### 7. Halaman History (`src/app/history/page.tsx`)

Client Component dengan data dari `GET /api/history`. Setiap baris transaksi menggunakan pola accordion (expand/collapse) dengan state `expandedId: string | null`.

Item dengan `status === 'NOT_FOUND'` dirender dengan kelas `text-red-500` dan badge label "Tidak Ditemukan".

### 8. Halaman Analytics (`src/app/analytics/page.tsx`)

Client Component dengan state `period: 'day' | 'week' | 'month'` (default `'day'`). Saat period berubah, memanggil `GET /api/analytics?period={period}`.

Menggunakan `recharts` (perlu diinstal: `npm install recharts`) untuk komponen `BarChart`. Data dari API langsung diumpankan ke prop `data` Recharts tanpa transformasi tambahan di klien.

### 9. Halaman Settings (`src/app/settings/page.tsx`)

Server Component sederhana yang merender `ThemeToggle` dan informasi tentang tema saat ini.

---

## Model Data

### Tipe-tipe TypeScript Baru

```typescript
// src/types/products.ts

export interface ProductListItem {
  id: string;
  nama: string;
  namaNormal: string;
  harga: number;
  stok: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  nama: string;
  harga: number;
  stok: number;
}

export interface UpdateProductInput {
  nama?: string;
  harga?: number;
  stok?: number;
}
```

```typescript
// src/types/history.ts

export interface HistoryInvoice {
  id: string;
  nomorInvoice: string;
  tanggalWaktu: string;       // ISO string
  totalKeseluruhan: number;
  items: HistoryInvoiceItem[];
}

export interface HistoryInvoiceItem {
  id: string;
  namaBarang: string;
  kuantitas: number;
  hargaSatuan: number;
  subtotal: number;
  status: 'OK' | 'NOT_FOUND' | 'AMBIGUOUS';
}
```

```typescript
// src/types/analytics.ts

export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface AnalyticsBucket {
  label: string;       // "2025-07-23" | "2025-W29" | "2025-07"
  totalPendapatan: number;
  jumlahTransaksi: number;
}

export interface AnalyticsResponse {
  period: AnalyticsPeriod;
  buckets: AnalyticsBucket[];
  summary: {
    totalPendapatan: number;
    jumlahTransaksi: number;
  };
}
```

### Fungsi `generateNamaNormal` (`src/lib/generateNamaNormal.ts`)

Fungsi ini mengekstrak logika yang sudah ada di `fuzzyMatch.ts` (`normalize`) menjadi fungsi dedicated untuk digunakan saat membuat/mengupdate produk:

```typescript
export function generateNamaNormal(nama: string): string {
  return nama.toLowerCase().trim().replace(/\s+/g, ' ');
}
```

Fungsi ini adalah pure function, tidak bergantung pada state eksternal, dan ideal untuk property-based testing.

---

## Desain API

### `POST /api/products` — Tambah Produk Baru

**Handler ditambahkan ke `src/app/api/products/route.ts`**

Request body (JSON):
```json
{
  "nama": "Teh Botol Sosro",
  "harga": 5000,
  "stok": 100
}
```

Validasi (menggunakan Zod):
```typescript
const CreateProductSchema = z.object({
  nama: z.string().min(1, "Nama tidak boleh kosong").trim(),
  harga: z.number().int().positive("Harga harus lebih dari 0"),
  stok: z.number().int().min(0, "Stok tidak boleh negatif"),
});
```

Response sukses (201):
```json
{
  "id": "clx...",
  "nama": "Teh Botol Sosro",
  "namaNormal": "teh botol sosro",
  "harga": 5000,
  "stok": 100
}
```

Response error validasi (400):
```json
{ "error": "Nama tidak boleh kosong" }
```

### `PUT /api/products/[id]` — Update Produk

**File baru: `src/app/api/products/[id]/route.ts`**

Request body (JSON — semua field opsional):
```json
{
  "nama": "Teh Botol",
  "harga": 4500,
  "stok": 80
}
```

Validasi:
```typescript
const UpdateProductSchema = z.object({
  nama: z.string().min(1).trim().optional(),
  harga: z.number().int().positive().optional(),
  stok: z.number().int().min(0).optional(),
});
```

Jika `nama` ada dalam body, `namaNormal` diperbarui otomatis. Response sukses (200): produk yang diperbarui. Response jika tidak ditemukan (404): `{ "error": "Produk tidak ditemukan" }`.

### `DELETE /api/products/[id]` — Hapus Produk

Tidak memerlukan body. Mengembalikan 200 dengan `{ "message": "Produk berhasil dihapus" }` atau 404 jika tidak ditemukan.

### `GET /api/products-list` — Daftar Semua Produk

**File baru: `src/app/api/products-list/route.ts`** (atau ditambahkan behavior ke `GET /api/products` tanpa `?q=`)

Query param opsional: `?q=` untuk filter (opsional). Tanpa `?q=`, mengembalikan semua produk diurutkan berdasarkan `nama`.

Response (200):
```json
[
  { "id": "...", "nama": "...", "namaNormal": "...", "harga": 5000, "stok": 10 },
  ...
]
```

### `GET /api/history` — Riwayat Transaksi

**File baru: `src/app/api/history/route.ts`**

Query params (semua opsional): `?page=1&limit=50`

Response (200):
```json
{
  "invoices": [
    {
      "id": "...",
      "nomorInvoice": "INV-20250723-001",
      "tanggalWaktu": "2025-07-23T10:30:00.000Z",
      "totalKeseluruhan": 50000,
      "items": [
        {
          "id": "...",
          "namaBarang": "Teh Botol",
          "kuantitas": 2,
          "hargaSatuan": 5000,
          "subtotal": 10000,
          "status": "OK"
        }
      ]
    }
  ],
  "total": 42
}
```

Implementasi Prisma:
```typescript
const invoices = await prisma.invoice.findMany({
  orderBy: { tanggalWaktu: 'desc' },
  include: { items: true },
});
```

### `GET /api/analytics?period=day|week|month` — Data Agregat

**File baru: `src/app/api/analytics/route.ts`**

Rentang waktu default:
- `day`: 30 hari terakhir
- `week`: 12 minggu terakhir  
- `month`: 12 bulan terakhir

Logika agregasi dilakukan di server menggunakan JavaScript (bukan raw SQL) untuk portabilitas:

```typescript
// Ambil invoice dalam rentang waktu
const invoices = await prisma.invoice.findMany({
  where: { tanggalWaktu: { gte: startDate } },
  select: { tanggalWaktu: true, totalKeseluruhan: true },
});

// Kelompokkan berdasarkan label bucket
const buckets = groupByPeriod(invoices, period);
```

Fungsi `groupByPeriod` adalah pure function yang menerima array invoice dan period, mengembalikan `AnalyticsBucket[]`. Ini memisahkan logika bisnis dari akses database sehingga mudah diuji.

Response (200): sesuai `AnalyticsResponse` di atas. Response jika `period` tidak valid (400): `{ "error": "Parameter period harus salah satu dari: day, week, month" }`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Fitur ini mengandung beberapa fungsi transformasi murni yang ideal untuk property-based testing: `generateNamaNormal`, `formatCurrency`, `groupByPeriod`, dan logika active tab. Library yang digunakan: `fast-check` (sudah terpasang di devDependencies).

### Refleksi Properti

Sebelum menulis properti final, dilakukan refleksi untuk menghilangkan redundansi:

- **Properti validasi produk (2.4 + 7.2)**: Keduanya menguji penolakan input invalid pada endpoint produk. Digabung menjadi satu properti yang komprehensif.
- **Properti rendering riwayat (3.2 + 3.4)**: 3.2 menguji informasi yang ditampilkan, 3.4 menguji styling NOT_FOUND. Keduanya adalah properti rendering independen, tidak redundan.
- **Properti tema (6.2 + 6.3 + 6.6)**: Ketiganya menguji aspek berbeda dari sistem tema (toggle round-trip, persistensi localStorage, class HTML). Tidak redundan, tetapi dapat digabung menjadi satu properti tema komprehensif.
- **Properti agregasi (4.5)**: Menggabungkan sum invariant mencakup 4.1-4.5 secara keseluruhan.

### Properti 1: Invariant Active Tab

*Untuk pathname* apa pun yang diberikan ke `BottomTabBar`, paling banyak satu tab yang dapat memiliki state aktif pada saat yang sama.

**Validates: Requirements 1.3**

### Properti 2: Fungsi `generateNamaNormal` menghasilkan output konsisten

*Untuk semua* string nama produk yang valid, `generateNamaNormal(nama)` harus menghasilkan string yang: (a) seluruhnya huruf kecil, (b) tidak memiliki whitespace di awal atau akhir, (c) tidak memiliki whitespace berurutan di tengah, dan (d) merupakan substring dari nama asli yang dinormalisasi.

**Validates: Requirements 2.7**

### Properti 3: Validasi input produk menolak semua input invalid

*Untuk semua* kombinasi input produk di mana setidaknya satu dari kondisi berikut terpenuhi: nama kosong/hanya-whitespace, harga ≤ 0, atau stok < 0 — validasi Zod `CreateProductSchema` harus mengembalikan hasil gagal (tidak pernah sukses).

**Validates: Requirements 2.4, 7.5**

### Properti 4: `formatCurrency` menghasilkan format Rupiah yang valid

*Untuk semua* bilangan bulat non-negatif `n`, `formatCurrency(n)` harus: (a) dimulai dengan prefix "Rp ", (b) tidak mengandung titik desimal, (c) menggunakan titik sebagai pemisah ribuan, dan (d) `formatCurrency(1000) === "Rp 1.000"`.

**Validates: Requirements 2.2, 3.2**

### Properti 5: Pengurutan riwayat bersifat deterministik dan tidak ada data hilang

*Untuk semua* array Invoice dengan N elemen, respons `GET /api/history` harus mengembalikan tepat N elemen dengan urutan `tanggalWaktu` descending: setiap `items[i].tanggalWaktu >= items[i+1].tanggalWaktu`.

**Validates: Requirements 3.1**

### Properti 6: Agregasi analytics memenuhi sum invariant

*Untuk semua* set Invoice dalam rentang waktu tertentu, `groupByPeriod(invoices, period)` harus memenuhi: `sum(bucket.totalPendapatan untuk semua bucket) === sum(invoice.totalKeseluruhan untuk semua invoice dalam rentang)`. Tidak ada rupiah yang hilang atau terhitung ganda.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Properti 7: Tema round-trip dan konsistensi class HTML

*Untuk semua* nilai tema awal (baik `'light'` maupun `'dark'`), memanggil `toggle()` dua kali harus mengembalikan tema ke nilai awal. Selain itu, setelah setiap pemanggilan `toggle()`, nilai `localStorage.getItem('tokomu-theme')` harus konsisten dengan class `dark` pada `document.documentElement` (keduanya menunjukkan tema yang sama).

**Validates: Requirements 6.2, 6.3, 6.6**

---

## Penanganan Error

### Strategi Umum API

Semua route handler mengikuti pola yang ada di `products/route.ts`:

1. **Validasi input** (Zod) → 400 Bad Request dengan pesan error deskriptif dalam Bahasa Indonesia
2. **Not found** (Prisma `P2025`) → 404 Not Found
3. **Error database** → 500 Internal Server Error, pesan generik ke klien
4. **Error tak terduga** → 500, tidak mengekspos stack trace

```typescript
// Pola standar error handler
try {
  // ... logika
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
  }
  if (isPrismaNotFound(error)) {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
  }
  console.error(error);
  return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
}
```

### Penanganan Error di Sisi Klien

- **Loading state:** Semua halaman menampilkan skeleton/spinner saat fetch berlangsung.
- **Error fetch:** Menampilkan `ErrorBanner` (komponen yang sudah ada di `/components/invoice/ErrorBanner.tsx`) dengan pesan yang deskriptif dan tombol retry.
- **Empty state:** Halaman History dan Analytics menampilkan ilustrasi/teks informatif jika tidak ada data.

---

## Strategi Pengujian

### Pendekatan Dual Testing

**Unit test (vitest):**
- Fungsi pure: `generateNamaNormal`, `formatCurrency`, `groupByPeriod`, logika active tab
- Kasus tepi dan kondisi error
- Mock Prisma untuk handler API

**Property-based test (vitest + fast-check):**
- Seluruh properti correctness yang didefinisikan di atas
- Minimum 100 iterasi per properti (default fast-check)
- Setiap tes PBT diberi tag komentar format: `// Feature: app-shell-dashboard, Property N: <teks properti>`

### Konfigurasi Property Test

```typescript
// Contoh konfigurasi fast-check untuk Properti 3
import { fc, test } from '@fast-check/vitest';

test.prop(
  [fc.record({
    nama: fc.string(),
    harga: fc.integer({ max: 0 }),  // harga non-positif
    stok: fc.nat(),
  })]
)(
  // Feature: app-shell-dashboard, Property 3: validasi menolak harga non-positif
  'validasi menolak produk dengan harga tidak valid',
  ({ nama, harga, stok }) => {
    const result = CreateProductSchema.safeParse({ nama, harga, stok });
    expect(result.success).toBe(false);
  }
);
```

### Integrasi Test

- `GET /api/history`: Verifikasi urutan descending dengan data fixture
- `GET /api/analytics`: Verifikasi sum invariant dengan set invoice yang diketahui
- `POST /api/products`: Verifikasi `namaNormal` di-generate dengan benar

### Test Tidak Diperlukan (Justifikasi)

- **Rendering Tailwind dark mode:** Diuji secara visual; class `dark` pada `<html>` sudah dicakup Properti 7
- **Responsivitas BottomTabBar:** Tes visual/browser; breakpoint Tailwind sudah teruji secara framework
- **Perilaku Recharts BarChart:** Library pihak ketiga, tidak perlu diuji ulang

---
