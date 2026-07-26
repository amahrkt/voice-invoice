'use client';

import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, ArrowLeft, Send } from 'lucide-react';

export default function AccountPage() {
  // State untuk melacak mode form: 'login', 'register', atau 'forgot-password'
  const [mode, setMode] = useState('login'); 

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 transition-all duration-350">
        
        {/* ================= FORM LOGIN ================= */}
        {mode === 'login' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {/* Judul */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Selamat Datang
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Silakan masuk ke akun VocaStruk Anda
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email atau Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="admin@toko.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kata Sandi
                  </label>
                  {/* Pemicu ke Form Lupa Sandi */}
                  <button 
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium focus:outline-none"
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md mt-4 text-sm"
              >
                <span>Masuk ke Akun</span>
                <LogIn size={18} />
              </button>
            </form>

            {/* Pemicu ke Form Daftar */}
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Belum punya akun?{' '}
              <button 
                onClick={() => setMode('register')}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline focus:outline-none"
              >
                Daftar sekarang
              </button>
            </div>
          </div>
        )}

        {/* ================= FORM DAFTAR / REGISTER ================= */}
        {mode === 'register' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Kembali ke Masuk</span>
            </button>

            <div className="text-left mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Buat Akun Baru
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Daftarkan email toko Anda untuk mulai menggunakan VocaStruk
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Alamat Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    placeholder="nama@toko.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md mt-4 text-sm"
              >
                <span>Daftar Akun</span>
                <UserPlus size={16} />
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              Sudah memiliki akun?{' '}
              <button 
                onClick={() => setMode('login')}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline focus:outline-none"
              >
                Masuk disini
              </button>
            </div>
          </div>
        )}

        {/* ================= FORM LUPA SANDI ================= */}
        {mode === 'forgot-password' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {/* Tombol Kembali */}
            <button 
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-4 transition-colors group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Kembali ke Masuk</span>
            </button>

            {/* Judul Lupa Sandi */}
            <div className="text-left mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Lupa Kata Sandi?
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Jangan khawatir! Masukkan alamat email yang terdaftar, dan kami akan mengirimkan tautan beserta kode untuk mereset kata sandi Anda.
              </p>
            </div>

            {/* Form Lupa Sandi */}
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              alert('Tautan reset kata sandi telah dikirim ke email Anda!');
            }}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    placeholder="nama@toko.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md mt-4 text-sm"
              >
                <span>Kirim Kode Reset</span>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}