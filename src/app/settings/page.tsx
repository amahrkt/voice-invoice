import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Pengaturan
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Kelola preferensi tampilan aplikasi Tokomu.
      </p>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-1 text-base font-semibold text-gray-800 dark:text-gray-100">
          Tema Tampilan
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Pilih antara tema <strong>Terang</strong> (latar putih, teks gelap) atau tema{' '}
          <strong>Gelap</strong> (latar gelap, teks terang) sesuai kenyamanan Anda.
          Pilihan tema disimpan secara lokal dan tetap aktif saat Anda membuka kembali aplikasi.
        </p>
        <ThemeToggle />
      </section>
    </div>
  );
}
