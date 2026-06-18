# Dokumen Requirements: Voice-to-Invoice

## Introduction

Fitur **Voice-to-Invoice** adalah sistem kasir berbasis suara dengan AI pada aplikasi Tokomu. Pengguna (kasir atau pemilik toko) cukup berbicara untuk menyebutkan nama barang beserta jumlahnya. Sistem kemudian secara otomatis mengenali ucapan, mengekstrak entitas barang dan kuantitas, mengambil data harga dari database produk, menghitung total harga, lalu menampilkan invoice dalam bentuk tabel yang siap dicetak. Fitur ini juga menghasilkan dokumen tambahan berupa Pick List dan Packing List.

### Glosarium

- **Tokomu**: Nama aplikasi kasir berbasis Next.js yang menjadi konteks sistem ini.
- **Voice_Recorder**: Komponen frontend yang menangkap input suara dari mikrofon perangkat pengguna.
- **Speech_To_Text_Engine**: Layanan atau modul yang mengonversi data audio menjadi teks transkripsi.
- **AI_Parser**: Modul AI yang mengekstrak entitas nama barang dan kuantitas dari teks transkripsi.
- **Product_Catalog**: Tabel produk di database PostgreSQL yang menyimpan data nama, harga, dan stok produk.
- **Invoice_Engine**: Modul backend yang menggabungkan data item yang dikenali dengan harga dari Product_Catalog dan menghitung total.
- **Invoice**: Dokumen transaksi yang memuat daftar item, harga satuan, kuantitas, subtotal per item, dan total keseluruhan.
- **Pick_List**: Dokumen yang memuat daftar item dan kuantitas yang perlu diambil dari rak/gudang.
- **Packing_List**: Dokumen yang memuat daftar item dan kuantitas yang perlu dikemas untuk pengiriman.
- **Struk**: Versi cetak ringkas dari Invoice yang ditujukan untuk pelanggan.
- **Invoice_Table**: Komponen frontend yang menampilkan data Invoice dalam format tabel.
- **Print_Handler**: Modul frontend yang menangani permintaan cetak dokumen ke printer atau PDF.
- **Session**: Satu sesi transaksi Voice-to-Invoice dari awal perekaman hingga invoice dicetak atau disimpan.
- **Item_Line**: Satu baris dalam Invoice yang merepresentasikan satu jenis produk beserta kuantitas dan harga.

---

## Requirements

### Requirement 1: Perekaman Suara

**User Story:** Sebagai kasir, saya ingin merekam suara saya langsung dari browser, sehingga saya dapat menyebutkan daftar barang tanpa harus mengetik manual.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol mulai rekam, THE Voice_Recorder SHALL meminta izin akses mikrofon kepada browser menggunakan Web API `getUserMedia`.
2. IF pengguna menolak izin mikrofon, THEN THE Voice_Recorder SHALL menampilkan pesan kesalahan yang menjelaskan bahwa akses mikrofon diperlukan, dan tombol rekam SHALL tetap dinonaktifkan hingga izin diberikan.
3. WHILE perekaman berlangsung, THE Voice_Recorder SHALL menampilkan indikator visual aktif (animasi pulsa merah) yang berkedip dengan interval tidak lebih dari 1 detik.
4. WHEN pengguna mengklik tombol berhenti rekam, THE Voice_Recorder SHALL menghentikan perekaman dan mengirimkan data audio ke Speech_To_Text_Engine.
5. IF durasi rekaman kurang dari 1 detik, THEN THE Voice_Recorder SHALL menampilkan pesan peringatan "Rekaman terlalu singkat" dan membuang data audio tanpa mengirimkannya ke Speech_To_Text_Engine.
6. THE Voice_Recorder SHALL mendukung format audio WAV dan WebM pada browser Chrome, Firefox, Edge, dan Safari.
7. IF durasi rekaman melebihi 120 detik, THEN THE Voice_Recorder SHALL menghentikan perekaman secara otomatis dan mengirimkan data audio yang telah terkumpul ke Speech_To_Text_Engine.
8. IF pengiriman data audio ke Speech_To_Text_Engine gagal, THEN THE Voice_Recorder SHALL mempertahankan data audio di memori dan menampilkan opsi "Coba Lagi" kepada pengguna tanpa kehilangan rekaman.

---

### Requirement 2: Konversi Suara ke Teks

**User Story:** Sebagai kasir, saya ingin ucapan saya dikonversi menjadi teks secara akurat, sehingga sistem dapat memahami barang apa yang saya sebutkan.

#### Acceptance Criteria

1. WHEN data audio dalam format WAV atau WebM diterima, THE Speech_To_Text_Engine SHALL mengonversi audio menjadi teks transkripsi dalam bahasa Indonesia.
2. WHEN konversi selesai, THE Speech_To_Text_Engine SHALL mengembalikan teks transkripsi ke AI_Parser dalam waktu tidak lebih dari 5 detik untuk audio berdurasi maksimal 60 detik.
3. IF konversi gagal karena layanan tidak tersedia atau batas waktu habis, THEN THE Speech_To_Text_Engine SHALL mengembalikan kode kesalahan `STT_SERVICE_UNAVAILABLE` beserta pesan deskriptif kepada sistem.
4. IF konversi gagal karena kualitas audio di bawah ambang batas (SNR < 10 dB), THEN THE Speech_To_Text_Engine SHALL mengembalikan kode kesalahan `STT_LOW_QUALITY` beserta saran untuk merekam ulang di lingkungan yang lebih sunyi.
5. IF durasi audio melebihi 120 detik, THEN THE Speech_To_Text_Engine SHALL menolak permintaan dan mengembalikan kode kesalahan `STT_AUDIO_TOO_LONG`.
6. IF audio valid namun tidak mengandung ucapan yang terdeteksi, THEN THE Speech_To_Text_Engine SHALL mengembalikan teks transkripsi kosong dengan kode status `STT_NO_SPEECH_DETECTED`.

---

### Requirement 3: Ekstraksi Entitas Barang dan Kuantitas

**User Story:** Sebagai kasir, saya ingin sistem secara otomatis mengenali nama barang dan jumlahnya dari ucapan saya, sehingga saya tidak perlu menginput data secara manual.

#### Acceptance Criteria

1. WHEN teks transkripsi diterima, THE AI_Parser SHALL mengekstrak seluruh pasangan nama barang dan kuantitas yang disebutkan dalam teks tersebut.
2. THE AI_Parser SHALL mengenali kuantitas dalam bentuk angka digit ("3"), kata bilangan kardinal Indonesia ("tiga"), dan kata satuan umum ("selusin" = 12, "lusin" = 12), dengan batas maksimum 50 item per transkripsi.
3. IF suatu item disebutkan tanpa kuantitas eksplisit atau dengan kuantitas yang tidak dapat dikenali, THEN THE AI_Parser SHALL menetapkan kuantitas sebesar 1 untuk item tersebut.
4. WHEN ekstraksi selesai, THE AI_Parser SHALL menghasilkan daftar terstruktur di mana setiap elemen memuat field `namaBarang` (string) dan `kuantitas` (integer ≥ 1).
5. IF teks transkripsi kosong atau tidak mengandung entitas barang yang dapat dikenali, THEN THE AI_Parser SHALL mengembalikan daftar kosong dengan status `PARSER_NO_ITEMS_DETECTED`.
6. THE AI_Parser SHALL menangani penyebutan beberapa item berbeda dalam satu transkripsi, hingga maksimum 50 item unik per panggilan.

---

### Requirement 4: Pencarian Harga dari Database Produk

**User Story:** Sebagai kasir, saya ingin sistem mengambil harga barang secara otomatis dari database, sehingga harga yang tampil selalu akurat dan konsisten.

#### Acceptance Criteria

1. WHEN daftar item dari AI_Parser diterima, THE Invoice_Engine SHALL mencari setiap item di Product_Catalog menggunakan field `namaBarang` sebagai kunci pencarian.
2. THE Invoice_Engine SHALL melakukan pencarian secara case-insensitive dan mendukung pencocokan parsial berbasis trigram atau Levenshtein distance ≤ 2 untuk mengakomodasi variasi ejaan dari hasil transkripsi.
3. IF satu nama barang cocok dengan lebih dari satu produk di Product_Catalog, THEN THE Invoice_Engine SHALL mengembalikan daftar maksimal 5 kandidat produk teratas beserta skor kecocokan kepada frontend untuk dipilih pengguna secara manual.
4. IF nama barang tidak ditemukan di Product_Catalog setelah fuzzy matching, THEN THE Invoice_Engine SHALL menandai item tersebut dengan status `NOT_FOUND` dan melanjutkan pemrosesan item lainnya.
5. WHEN semua item yang berstatus bukan `NOT_FOUND` telah dipetakan ke Product_Catalog, THE Invoice_Engine SHALL mengambil `hargaSatuan` masing-masing produk dari Product_Catalog dalam satu query batch.

---

### Requirement 5: Penghitungan Total dan Pembuatan Invoice

**User Story:** Sebagai kasir, saya ingin sistem menghitung total harga secara otomatis dan membuat invoice, sehingga saya mendapatkan rekapan transaksi yang lengkap dan akurat.

#### Acceptance Criteria

1. WHEN semua harga satuan berhasil diambil, THE Invoice_Engine SHALL menghitung subtotal setiap Item_Line dengan rumus: `subtotal = hargaSatuan × kuantitas`, menggunakan aritmatika integer untuk menghindari kesalahan pembulatan floating-point.
2. THE Invoice_Engine SHALL menghitung total keseluruhan Invoice dengan menjumlahkan seluruh `subtotal` dari Item_Line yang berstatus bukan `NOT_FOUND`.
3. THE Invoice_Engine SHALL menghasilkan objek Invoice yang memuat: `nomorInvoice`, `tanggalWaktu` (ISO 8601), daftar `itemLines` (nama produk, kuantitas, harga satuan, subtotal, status), dan `totalKeseluruhan`.
4. WHEN Invoice berhasil dibuat, THE Invoice_Engine SHALL menyimpan data Invoice ke tabel `Invoice` di database secara atomik dalam satu transaksi database.
5. IF terdapat item dengan status `NOT_FOUND`, THEN THE Invoice_Engine SHALL tetap menghasilkan Invoice dengan menyertakan baris item tersebut berlabel "Produk Tidak Ditemukan" dan subtotal bernilai 0.
6. THE Invoice_Engine SHALL menghasilkan `nomorInvoice` unik per Session menggunakan format `INV-YYYYMMDD-XXXX` di mana XXXX adalah nomor urut harian yang di-reset setiap tengah malam (00:00 WIB).

---

### Requirement 6: Tampilan Invoice di Frontend

**User Story:** Sebagai kasir, saya ingin melihat invoice yang dihasilkan dalam bentuk tabel yang jelas dan terstruktur, sehingga saya dapat memverifikasi isi transaksi sebelum mencetak.

#### Acceptance Criteria

1. WHEN Invoice berhasil diterima dari Invoice_Engine, THE Invoice_Table SHALL merender tabel dengan kolom: No, Nama Produk, Kuantitas, Harga Satuan, dan Subtotal, dalam waktu tidak lebih dari 500ms.
2. THE Invoice_Table SHALL menampilkan baris "Total" di bagian bawah tabel, menampilkan nilai `totalKeseluruhan`.
3. THE Invoice_Table SHALL menampilkan `nomorInvoice`, tanggal, dan waktu transaksi di bagian header tabel.
4. IF suatu Item_Line memiliki status `NOT_FOUND`, THEN THE Invoice_Table SHALL merender baris tersebut dengan teks berwarna merah (`text-red-600`) dan ikon peringatan (⚠).
5. WHEN Invoice ditampilkan, THE Invoice_Table SHALL menampilkan teks transkripsi suara asli di panel terpisah di atas tabel dengan label "Transkripsi Suara".
6. THE Invoice_Table SHALL memformat semua nilai `hargaSatuan` dan `subtotal` menggunakan format `Rp X.XXX` (Rupiah, pemisah ribuan titik, tanpa desimal).
7. IF Invoice belum dihasilkan dan transkripsi sedang diproses, THE Invoice_Table SHALL menampilkan skeleton loader atau spinner untuk memberi tahu pengguna bahwa sistem sedang bekerja.

---

### Requirement 7: Pembuatan Pick List

**User Story:** Sebagai staf gudang, saya ingin mendapatkan Pick List dari transaksi, sehingga saya dapat menyiapkan barang yang perlu diambil dari rak dengan cepat dan tepat.

#### Acceptance Criteria

1. WHEN Invoice berhasil dibuat, THE Invoice_Engine SHALL menghasilkan Pick_List yang hanya memuat item dengan status bukan `NOT_FOUND`, berisi nama produk dan kuantitas masing-masing.
2. THE Invoice_Engine SHALL mengurutkan item pada Pick_List berdasarkan nama produk secara alfabetis (A–Z).
3. WHEN Pick_List tersedia, THE Invoice_Table SHALL menampilkan Pick_List dalam tab berlabel "Pick List" yang terpisah dari tab Invoice utama.
4. THE Pick_List SHALL mencantumkan `nomorInvoice` referensi yang identik dengan Invoice terkait di bagian header.

---

### Requirement 8: Pembuatan Packing List

**User Story:** Sebagai staf pengemasan, saya ingin mendapatkan Packing List dari transaksi, sehingga saya dapat mengemas barang yang akan dikirim dengan akurat.

#### Acceptance Criteria

1. WHEN Invoice berhasil dibuat, THE Invoice_Engine SHALL menghasilkan Packing_List yang hanya memuat item dengan status bukan `NOT_FOUND`, berisi nama produk, kuantitas, dan kolom centang (checkbox) status kemas yang diinisialisasi dalam keadaan tidak tercentang.
2. WHEN Packing_List tersedia, THE Invoice_Table SHALL menampilkan Packing_List dalam tab berlabel "Packing List" yang terpisah dari tab Invoice utama dan tab Pick List.
3. THE Packing_List SHALL mencantumkan `nomorInvoice` referensi yang identik dengan Invoice terkait di bagian header.
4. THE Packing_List SHALL mencantumkan tanggal dan waktu pembuatan yang sama dengan `tanggalWaktu` pada Invoice terkait.

---

### Requirement 9: Cetak Struk dan Invoice

**User Story:** Sebagai kasir, saya ingin dapat mencetak struk atau invoice lengkap, sehingga saya dapat memberikan bukti transaksi fisik kepada pelanggan atau menyimpannya sebagai arsip.

#### Acceptance Criteria

1. WHEN pengguna mengklik tombol cetak, THE Print_Handler SHALL memicu `window.print()` browser dengan tampilan Invoice yang telah dioptimalkan menggunakan CSS `@media print`.
2. THE Print_Handler SHALL menyediakan dua tombol cetak yang terpisah: "Cetak Struk" dan "Cetak Invoice Lengkap".
3. WHEN pengguna mengklik "Cetak Struk", THE Print_Handler SHALL merender layout lebar 80mm dengan: nama toko, `nomorInvoice`, tanggal, daftar item (nama, kuantitas, subtotal), dan `totalKeseluruhan`.
4. WHEN pengguna mengklik "Cetak Invoice Lengkap", THE Print_Handler SHALL merender seluruh kolom tabel Invoice (No, Nama Produk, Kuantitas, Harga Satuan, Subtotal) beserta `nomorInvoice`, tanggal, dan `totalKeseluruhan`.
5. THE Print_Handler SHALL menyediakan tombol "Ekspor PDF" yang memanggil `window.print()` dengan tujuan "Save as PDF" atau menggunakan library seperti `jsPDF` untuk menghasilkan file PDF yang dapat diunduh.
6. WHEN proses cetak atau ekspor PDF dipicu, THE Print_Handler SHALL menyembunyikan elemen dengan class `no-print` (navigasi, tombol aksi, indikator status, panel transkripsi) menggunakan aturan CSS `@media print { .no-print { display: none; } }`.

---

### Requirement 10: Penanganan Kesalahan dan Pemulihan Sesi

**User Story:** Sebagai kasir, saya ingin sistem menampilkan pesan kesalahan yang jelas ketika ada masalah, sehingga saya dapat mengambil tindakan yang tepat tanpa kehilangan data transaksi.

#### Acceptance Criteria

1. IF koneksi ke database terputus selama pemrosesan, THEN THE Invoice_Engine SHALL mengembalikan kode kesalahan `DB_CONNECTION_ERROR` ke frontend, dan frontend SHALL menampilkan pesan "Gagal terhubung ke database. Data sesi masih tersimpan." sambil mempertahankan data transkripsi dan item yang sudah diekstraksi di state lokal.
2. IF permintaan ke Speech_To_Text_Engine gagal dengan kode `STT_SERVICE_UNAVAILABLE`, THEN THE frontend SHALL menampilkan pesan kesalahan deskriptif dan tombol "Coba Rekam Lagi" tanpa mereset state Session saat ini.
3. WHEN kesalahan terjadi pada tahap mana pun dalam alur pemrosesan, THE Tokomu API route SHALL mencatat log kesalahan ke console server yang memuat: timestamp, kode kesalahan, tahap yang gagal, dan `sessionId`.
4. THE Invoice_Table SHALL menampilkan tombol "Edit" pada setiap baris Item_Line yang memungkinkan kasir mengoreksi nama produk, kuantitas, atau menghapus baris sebelum invoice difinalisasi.
5. WHEN kasir mengklik "Edit" pada suatu Item_Line dan menyimpan perubahan, THE Invoice_Table SHALL memperbarui `subtotal` baris tersebut dan `totalKeseluruhan` secara otomatis tanpa memerlukan reload halaman.
