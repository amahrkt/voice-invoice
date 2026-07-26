'use client';

import { useState } from "react";
import Link from "next/link";
import { Menu, Home, Info, FileText, Settings, User, LogOut } from "lucide-react";
import VocaStrukLogo from "./VocaStrukLogo";

function Header() {
  // State untuk mengontrol buka/tutup dropdown menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // State BARU untuk mengontrol buka/tutup modal konfirmasi logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Fungsi saat tombol logout di dropdown diklik
  const handleLogoutClick = () => {
    setIsDropdownOpen(false); // Tutup dropdown terlebih dahulu
    setShowLogoutModal(true); // Tampilkan pop-up konfirmasi modal
  };

  // Fungsi saat user memilih "Ya, Keluar"
  const confirmLogout = () => {
    setShowLogoutModal(false);
    // Diarahkan langsung ke halaman login/account yang sudah dibuat sebelumnya
    window.location.href = '/account';
  };

  // Fungsi saat user memilih "Tidak"
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <div>
        <header className="header">
          <nav className="flex items-center justify-between w-full px-4 relative">
            
            {/* Kiri: Logo Container */}
            <div className="logo py-2">
              <Link href="/" className="flex flex-col items-center justify-center">
                <VocaStrukLogo size={30} className="text-white" />
                <span className="font-black text-white text-[10px] tracking-[0.2em] uppercase mt-1 leading-none">
                  VocaStruk
                </span>
              </Link>
            </div>

            {/* Kanan: Ikon Menu Tiga Garis */}
            <div className="relative flex items-center">
              <button 
                onClick={toggleDropdown}
                className="text-white hover:text-gray-300 transition-colors p-2 focus:outline-none flex items-center justify-center rounded-lg hover:bg-slate-800"
                aria-label="Toggle Menu"
              >
                <Menu size={24} />
              </button>

              {/* --- DROPDOWN MENU PANEL --- */}
              {isDropdownOpen && (
                <>
                  {/* Overlay transparan agar dropdown menutup ketika mengklik area luar */}
                  <div 
                    className="fixed inset-0 z-40 print:hidden" 
                    onClick={toggleDropdown}
                  />
                  
                  {/* Kotak Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 print:hidden mx-1">
                    
                    <Link 
                      href="/" 
                      onClick={toggleDropdown}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors rounded-lg mx-1"
                    >
                      <Home size={16} className="text-gray-600 dark:text-gray-400" />
                      <span>Home</span>
                    </Link>

                    <Link 
                      href="/about" 
                      onClick={toggleDropdown}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors rounded-lg mx-1"
                    >
                      <Info size={16} className="text-gray-600 dark:text-gray-400" />
                      <span>About</span>
                    </Link>

                    <Link 
                      href="/laporan" 
                      onClick={toggleDropdown}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors rounded-lg mx-1"
                    >
                      <FileText size={16} className="text-gray-600 dark:text-gray-400" />
                      <span>Laporan</span>
                    </Link>

                    <Link 
                      href="/settings" 
                      onClick={toggleDropdown}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors rounded-lg mx-1"
                    >
                      <Settings size={16} className="text-gray-600 dark:text-gray-400" />
                      <span>Setting</span>
                    </Link>

                    <Link 
                      href="/account" 
                      onClick={toggleDropdown}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors rounded-lg mx-1"
                    >
                      <User size={16} className="text-gray-600 dark:text-gray-400" />
                      <span>Account</span>
                    </Link>

                    {/* Garis Pembatas tipis adaptif */}
                    <div className="h-px bg-gray-200 dark:bg-slate-800 my-1 mx-1" />

                    {/* Tombol Logout memanggil handleLogoutClick untuk memicu modal pop-up */}
                    <button 
                      onClick={handleLogoutClick}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-[calc(100%-8px)] text-left rounded-lg mx-1"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </nav>
        </header>
      </div>

      {/* ================= MODAL KONFIRMASI LOGOUT COMPONENT ================= */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:hidden">
          {/* Latar Belakang Gelap Transparan (Backdrop) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={cancelLogout}
          />
          
          {/* Kotak Dialog Konfirmasi */}
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
            <div className="flex flex-col items-center text-center">
              
              {/* Tempat Lingkaran Ikon */}
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <LogOut size={28} className="text-red-600 dark:text-red-400 ml-1" />
              </div>
              
              {/* Teks Dialog */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Konfirmasi Keluar
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun ini? Anda harus masuk kembali untuk mengakses panel VocaStruk Anda.
              </p>
              
              {/* Tombol Opsi Pilihan */}
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={cancelLogout}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-slate-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shadow-md shadow-red-500/10 text-sm"
                >
                  Ya, Keluar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;