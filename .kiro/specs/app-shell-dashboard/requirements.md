# Dokumen Persyaratan: App Shell & Dashboard

## Pendahuluan

Fitur ini menambahkan navigasi shell lengkap ke aplikasi Tokomu — sebuah aplikasi kasir berbasis AI yang dibangun di atas Next.js 15. Saat ini aplikasi hanya memiliki header sederhana dengan tautan "Home" dan "About". Fitur ini akan menambahkan:

1. **Bottom Tab Bar** — navigasi utama berbasis tab di bagian bawah layar, responsif untuk mobile, tablet, dan desktop, dengan 4 tab: Record, Products, History, dan Analytics.
2. **Halaman Products** — manajemen katalog produk (tambah, edit, hapus, lihat stok).
3. **Halaman History** — riwayat barang yang terjual dan barang habis stok.
4. **Halaman Analytics** — grafik penjualan per hari, minggu, dan bulan.
5. **Navbar Settings** — tautan Settings di navbar dengan halaman toggle dark/light mode.
6. **Dark/Light Mode** — sistem tema global yang menyimpan preferensi ke `localStorage`.

---

## Glosarium

- **App_Shell**: Komponen tata letak utama yang mencakup Header, Bottom_Tab_Bar, dan area konten halaman.
- **Bottom_Tab_Bar**: Komponen navigasi tab yang ditampilkan di bagian bawah layar untuk navigasi antar fitur utama.
- **Tab_Record**: Tab navigasi yang mengarah ke halaman Voice-to-Invoice (`/invoice`).
- **Tab_Products**: Tab navigasi yang mengarah ke halaman manajemen produk (`/products`).
- **Tab_History**: Tab navigasi yang mengarah ke halaman riwayat penjualan (`/history`).
- **Tab_Analytics**: Tab navigasi yang mengarah ke halaman analitik penjualan (`/analytics`).
- **Theme_Provider**: Komponen yang mengelola dan mendistribusikan status tema (dark/light) ke seluruh aplikasi.
- **Theme_Toggle**: Komponen UI berupa tombol/switch untuk berpindah antara mode gelap dan terang.
- **Settings_Page**: Halaman di `/settings` yang berisi pengaturan preferensi pengguna termasuk tema.
- **Products_Page**: Halaman di `/products` untuk manajemen katalog produk.
- **History_Page**: Halaman di `/history` yang menampilkan riwayat transaksi dan barang terjual/habis.
- **Analytics_Page**: Halaman di `/analytics` yang menampilkan grafik dan statistik penjualan.
- **Product**: Model data produk dengan field `id`, `nama`, `namaNormal`, `harga`, `stok`.
- **Invoice**: Model data transaksi dengan field `id`, `nomorInvoice`, `tanggalWaktu`, `transcript`, `totalKeseluruhan`, `sessionId`.
- **InvoiceItem**: Model data item dalam transaksi dengan field `invoiceId`, `productId`, `namaBarang`, `kuantitas`, `hargaSatuan`, `subtotal`, `status`.
- **localStorage**: Penyimpanan browser sisi klien untuk menyimpan preferensi pengguna secara persisten.
- **Active_Tab**: Tab yang sedang aktif/dipilih, ditunjukkan dengan indikator visual berbeda.

---

## Persyaratan

### Persyaratan 1: Bottom Tab Bar — Navigasi Utama

**User Story:** Sebagai pengguna, saya ingin memiliki navigasi tab di bagian bawah layar, sehingga saya dapat berpindah antar fitur utama aplikasi dengan mudah di perangkat apa pun.

#### Kriteria Penerimaan

1. THE App_Shell SHALL menampilkan Bottom_Tab_Bar dengan 4 tab: Record, Products, History, dan Analytics.
2. WHEN pengguna mengetuk atau mengklik sebuah tab, THE Bottom_Tab_Bar SHALL menavigasi ke halaman yang sesuai dengan tab tersebut.
3. WHILE pengguna berada di halaman yang bersesuaian dengan sebuah tab, THE Bottom_Tab_Bar SHALL menampilkan tab tersebut dalam kondisi Active_Tab dengan indikator visual (warna dan/atau ikon berbeda).
4. THE Bottom_Tab_Bar SHALL menampilkan ikon dari lucide-react dan label teks di bawah setiap ikon untuk setiap tab.
5. THE Bottom_Tab_Bar SHALL diposisikan secara tetap (fixed) di bagian bawah layar sehingga selalu terlihat saat halaman di-scroll.
6. THE Bottom_Tab_Bar SHALL menerapkan desain responsif yang berfungsi pada ukuran layar mobile (lebar < 768px), tablet (768px–1024px), dan desktop (lebar > 1024px).
7. THE Tab_Record SHALL menggunakan ikon `Mic` dan mengarah ke rute `/invoice`.
8. THE Tab_Products SHALL menggunakan ikon `Package` dan mengarah ke rute `/products`.
9. THE Tab_History SHALL menggunakan ikon `History` dan mengarah ke rute `/history`.
10. THE Tab_Analytics SHALL menggunakan ikon `BarChart2` dan mengarah ke rute `/analytics`.

---

### Persyaratan 2: Halaman Products — Manajemen Katalog

**User Story:** Sebagai pemilik toko, saya ingin mengelola katalog produk saya, sehingga saya dapat menambah produk baru, mengubah harga atau stok, dan menghapus produk yang tidak dijual lagi.

#### Kriteria Penerimaan

1. WHEN pengguna mengakses `/products`, THE Products_Page SHALL menampilkan daftar semua produk yang ada di database.
2. THE Products_Page SHALL menampilkan informasi berikut untuk setiap produk: nama, harga (dalam format Rupiah), dan stok.
3. WHEN pengguna mengisi formulir tambah produk dengan nama, harga, dan stok yang valid lalu menekan tombol simpan, THE Products_Page SHALL menyimpan produk baru ke database dan memperbarui daftar produk.
4. IF pengguna mengirim formulir tambah produk dengan nama kosong, harga non-positif, atau stok negatif, THEN THE Products_Page SHALL menampilkan pesan kesalahan validasi dan tidak menyimpan data.
5. WHEN pengguna memilih produk untuk diedit dan menyimpan perubahan yang valid, THE Products_Page SHALL memperbarui data produk di database dan memperbarui tampilan daftar.
6. WHEN pengguna menghapus sebuah produk, THE Products_Page SHALL menampilkan konfirmasi sebelum menghapus dan menghapus produk dari database setelah konfirmasi.
7. THE Products_Page SHALL menghasilkan nilai `namaNormal` secara otomatis dari field `nama` (lowercase, tanpa karakter khusus) tanpa memerlukan input manual dari pengguna.
8. WHEN data produk sedang dimuat dari server, THE Products_Page SHALL menampilkan indikator loading.

---

### Persyaratan 3: Halaman History — Riwayat Penjualan

**User Story:** Sebagai pemilik toko, saya ingin melihat riwayat barang yang terjual dan barang yang habis stok, sehingga saya dapat memantau performa penjualan dan ketersediaan produk.

#### Kriteria Penerimaan

1. WHEN pengguna mengakses `/history`, THE History_Page SHALL menampilkan daftar transaksi (Invoice) yang diurutkan dari yang terbaru ke terlama.
2. THE History_Page SHALL menampilkan informasi berikut untuk setiap transaksi: nomor invoice, tanggal dan waktu, dan total keseluruhan dalam format Rupiah.
3. WHEN pengguna memilih sebuah transaksi, THE History_Page SHALL menampilkan daftar item di dalam transaksi tersebut beserta nama barang, kuantitas, harga satuan, subtotal, dan status item.
4. THE History_Page SHALL menandai InvoiceItem dengan status `NOT_FOUND` secara visual berbeda (misalnya dengan warna merah atau label khusus) untuk memudahkan identifikasi barang yang tidak ditemukan.
5. THE History_Page SHALL menampilkan ringkasan jumlah transaksi yang ditampilkan.
6. WHEN tidak ada transaksi yang tersimpan, THE History_Page SHALL menampilkan pesan kosong yang informatif.

---

### Persyaratan 4: Halaman Analytics — Grafik Penjualan

**User Story:** Sebagai pemilik toko, saya ingin melihat grafik penjualan secara visual, sehingga saya dapat memahami tren pendapatan toko per hari, minggu, dan bulan.

#### Kriteria Penerimaan

1. WHEN pengguna mengakses `/analytics`, THE Analytics_Page SHALL menampilkan grafik penjualan dengan tiga tampilan pilihan: per hari, per minggu, dan per bulan.
2. WHEN pengguna memilih tampilan "per hari", THE Analytics_Page SHALL menampilkan grafik total pendapatan untuk setiap hari dalam 30 hari terakhir.
3. WHEN pengguna memilih tampilan "per minggu", THE Analytics_Page SHALL menampilkan grafik total pendapatan untuk setiap minggu dalam 12 minggu terakhir.
4. WHEN pengguna memilih tampilan "per bulan", THE Analytics_Page SHALL menampilkan grafik total pendapatan untuk setiap bulan dalam 12 bulan terakhir.
5. THE Analytics_Page SHALL menampilkan ringkasan statistik berupa total pendapatan dan jumlah transaksi pada periode yang dipilih.
6. WHEN tidak ada data transaksi pada periode yang dipilih, THE Analytics_Page SHALL menampilkan pesan yang menginformasikan tidak ada data.
7. THE Analytics_Page SHALL mengambil data agregat dari API backend dan tidak melakukan kalkulasi di sisi klien.

---

### Persyaratan 5: Navbar — Penambahan Tautan Settings

**User Story:** Sebagai pengguna, saya ingin ada tautan "Settings" di navbar, sehingga saya dapat mengakses halaman pengaturan aplikasi dengan mudah.

#### Kriteria Penerimaan

1. THE Header SHALL menampilkan tautan "Settings" di sebelah kanan tautan "About" yang sudah ada.
2. WHEN pengguna mengklik tautan "Settings", THE Header SHALL menavigasi pengguna ke halaman `/settings`.
3. THE Settings_Page SHALL menampilkan antarmuka yang jelas untuk mengubah preferensi pengguna.
4. THE Settings_Page SHALL memuat dan menampilkan status tema saat ini (gelap atau terang) saat halaman dibuka.

---

### Persyaratan 6: Dark/Light Mode — Tema Global

**User Story:** Sebagai pengguna, saya ingin dapat beralih antara mode gelap dan terang, sehingga saya dapat menggunakan aplikasi dengan nyaman sesuai kondisi pencahayaan.

#### Kriteria Penerimaan

1. THE Settings_Page SHALL menampilkan Theme_Toggle berupa tombol atau switch untuk berpindah antara mode gelap (dark) dan terang (light).
2. WHEN pengguna mengaktifkan Theme_Toggle, THE Theme_Provider SHALL mengubah tema seluruh aplikasi secara instan tanpa perlu memuat ulang halaman.
3. WHEN tema diubah, THE Theme_Provider SHALL menyimpan preferensi tema ke `localStorage` dengan kunci `tokomu-theme`.
4. WHEN aplikasi pertama kali dimuat, THE Theme_Provider SHALL membaca nilai tema dari `localStorage` dan menerapkan tema yang tersimpan.
5. IF tidak ada nilai tema di `localStorage`, THEN THE Theme_Provider SHALL menerapkan tema terang (light) sebagai default.
6. THE Theme_Provider SHALL menerapkan tema dengan cara menambah atau menghapus class `dark` pada elemen `<html>` untuk kompatibilitas dengan Tailwind CSS dark mode.
7. THE App_Shell SHALL menerapkan warna latar, teks, dan komponen yang sesuai untuk kedua mode tema pada semua halaman.

---

### Persyaratan 7: API Backend — Endpoint Baru

**User Story:** Sebagai developer, saya ingin tersedia endpoint API yang diperlukan, sehingga halaman Products, History, dan Analytics dapat mengambil dan memanipulasi data dengan benar.

#### Kriteria Penerimaan

1. THE Products_Page SHALL menggunakan endpoint `GET /api/products` yang sudah ada untuk mengambil daftar produk.
2. THE App_Shell SHALL mendukung endpoint `POST /api/products` untuk menambah produk baru, `PUT /api/products/[id]` untuk memperbarui produk, dan `DELETE /api/products/[id]` untuk menghapus produk.
3. THE App_Shell SHALL menyediakan endpoint `GET /api/history` yang mengembalikan daftar Invoice beserta InvoiceItem-nya dalam urutan terbaru ke terlama.
4. THE App_Shell SHALL menyediakan endpoint `GET /api/analytics` yang menerima parameter `period` (`day`, `week`, `month`) dan mengembalikan data agregat pendapatan per periode.
5. IF sebuah request ke API mengandung data yang tidak valid, THEN THE App_Shell SHALL mengembalikan respons HTTP 400 beserta pesan kesalahan yang deskriptif.
6. IF terjadi kesalahan di sisi server, THEN THE App_Shell SHALL mengembalikan respons HTTP 500 dan tidak mengekspos detail internal error ke klien.
