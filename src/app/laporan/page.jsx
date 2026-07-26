'use client';

import { useState } from 'react';
import { Download, TrendingUp, Receipt, CreditCard, Calendar, Search } from 'lucide-react';

export default function LaporanPage() {
  // Data dummy untuk keperluan desain UI Laporan
  const summaryData = [
    { title: "Pendapatan Hari Ini", amount: "Rp 1.250.000", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { title: "Total Transaksi", amount: "42", icon: Receipt, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Rata-rata Penjualan", amount: "Rp 29.700", icon: CreditCard, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  ];

  const recentTransactions = [
    { id: "INV-20260726-01", time: "08:15", customer: "Pelanggan Umum", items: 3, total: 174000, status: "Selesai" },
    { id: "INV-20260726-02", time: "09:30", customer: "Bpk. Budi", items: 1, total: 65000, status: "Selesai" },
    { id: "INV-20260726-03", time: "10:05", customer: "Ibu Siti", items: 5, total: 320000, status: "Selesai" },
    { id: "INV-20260726-04", time: "11:20", customer: "Pelanggan Umum", items: 2, total: 45000, status: "Dibatalkan" },
    { id: "INV-20260726-05", time: "12:45", customer: "Kak Andi", items: 4, total: 210000, status: "Selesai" },
  ];

  const [filterDate, setFilterDate] = useState("Hari Ini");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* ================= HEADER & TOMBOL UNDUH ================= */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Keuangan (dummy data)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ringkasan aktivitas dan transaksi toko Anda.</p>
          </div>
          
          {/* Tombol responsif: Kecil di HP, Normal di PC */}
          <button className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold transition-all shadow-sm whitespace-nowrap
            px-2.5 py-1.5 text-[11px] gap-1.5
            md:gap-2 md:px-4 md:py-2 md:text-sm md:rounded-xl">
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Unduh Laporan</span>
          </button>
        </div>

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {summaryData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.bg}`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.title}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{item.amount}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= TABEL TRANSAKSI ================= */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          
          {/* Filter & Search Bar Tabel */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Transaksi</h2>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Cari invoice..." 
                  className="pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white w-full sm:w-48 transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="hidden sm:inline">{filterDate}</span>
              </button>
            </div>
          </div>

          {/* Wrapper Tabel agar bisa di-scroll menyamping di HP */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-4 font-medium">ID Invoice</th>
                  <th className="px-5 py-4 font-medium">Waktu</th>
                  <th className="px-5 py-4 font-medium">Pelanggan</th>
                  <th className="px-5 py-4 font-medium text-center">Jml Item</th>
                  <th className="px-5 py-4 font-medium text-right">Total (Rp)</th>
                  <th className="px-5 py-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentTransactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">{tx.id}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{tx.time}</td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{tx.customer}</td>
                    <td className="px-5 py-4 text-center text-gray-700 dark:text-gray-300">{tx.items}</td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900 dark:text-white">
                      {tx.total.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-4 flex justify-center">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        tx.status === 'Selesai' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Placeholder */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Menampilkan 1 hingga 5 dari 42 entri</span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" disabled>Sebel.</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded font-medium">1</button>
              <button className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">2</button>
              <button className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">Lanjut</button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}