'use client';

import { Printer } from 'lucide-react';

export default function PrintPage() {
  // Data sementara (dummy) untuk keperluan desain UI
  const invoiceData = {
    nomor: "INV-20260724",
    tanggal: "24 Juli 2026",
    kasir: "Admin Utama (Dibawah ini adalah data dummy untuk keperluan desain ui saja)",
    items: [
      { nama: "Beras Premium 5kg", qty: 1, harga: 65000, subtotal: 65000 },
      { nama: "Minyak Goreng 2L", qty: 2, harga: 32000, subtotal: 64000 },
      { nama: "Gula Pasir 1kg", qty: 3, harga: 15000, subtotal: 45000 },
    ],
    total: 174000
  };

  // Fungsi untuk memicu dialog print bawaan browser
  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Bagian Header & Tombol Aksi (Akan disembunyikan saat diprint) */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pratinjau Faktur</h1>
            <p className="text-sm text-gray-500">Cetak faktur transaksi terakhir</p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Printer size={18} />
            <span>Cetak Faktur</span>
          </button>
        </div>

        {/* Desain Kertas Faktur */}
        <div className="bg-white border border-gray-200 p-8 sm:p-10 rounded-xl shadow-sm">
          
          {/* Kop Surat / Header Faktur */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 pb-6 mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">TOKO-MU</h2>
              <p className="text-sm text-gray-500 mt-2">
                Jl. Perdagangan No. 123<br />
                Bekasi, Jawa Barat
              </p>
            </div>
            <div className="sm:text-right">
              <h3 className="text-xl font-bold text-gray-800 tracking-widest uppercase">Invoice</h3>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold text-gray-800">No:</span> {invoiceData.nomor}</p>
                <p><span className="font-semibold text-gray-800">Tanggal:</span> {invoiceData.tanggal}</p>
                <p><span className="font-semibold text-gray-800">Kasir:</span> {invoiceData.kasir}</p>
              </div>
            </div>
          </div>

          {/* Tabel Daftar Barang */}
          <div className="overflow-x-auto">
            <table className="w-full text-left mb-6 min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                  <th className="py-3 font-semibold">Deskripsi Barang</th>
                  <th className="py-3 font-semibold text-center w-20">Qty</th>
                  <th className="py-3 font-semibold text-right w-32">Harga</th>
                  <th className="py-3 font-semibold text-right w-32">Subtotal</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                {invoiceData.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 font-medium">{item.nama}</td>
                    <td className="py-4 text-center">{item.qty}</td>
                    <td className="py-4 text-right">Rp {item.harga.toLocaleString('id-ID')}</td>
                    <td className="py-4 text-right font-semibold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Ringkasan */}
          <div className="flex justify-end mt-4">
            <div className="w-full sm:w-1/2 md:w-1/3">
              <div className="flex justify-between items-center border-t-2 border-dashed border-gray-300 pt-4">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-black text-blue-600">
                  Rp {invoiceData.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Faktur */}
          <div className="mt-16 text-center text-gray-500 text-xs sm:text-sm">
            <p className="font-medium text-gray-700">Terima kasih atas kunjungan Anda!</p>
            <p className="mt-1">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
          </div>

        </div>
      </div>
    </main>
  );
}