'use client';

import { useState } from "react";
import Link from "next/link";
import { Menu, Home, Info, FileText, Settings, User, LogOut } from "lucide-react";
import VocaStrukLogo from "./VocaStrukLogo";

function Header() {
  // State untuk mengontrol buka/tutup dropdown menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div>
      <header className="header">
        <nav className="flex items-center justify-between w-full px-4 relative">
          
          {/* Kiri: Logo Container (Otomatis menyesuaikan mode gelap karena layout CSS) */}
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

            {/* --- DROPDOWN MENU PANEL (FINAL MODE GELAP AMAN) --- */}
            {isDropdownOpen && (
              <>
                {/* Overlay transparan agar dropdown menutup ketika mengklik area luar */}
                <div 
                  className="fixed inset-0 z-40 print:hidden" 
                  onClick={toggleDropdown}
                />
                
                {/* Kotak Dropdown Menu - TAMBAHKAN KELAS dark: DI SINI */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 print:hidden mx-1">
                  
                  {/* Link Menu dengan teks adaptif gelap/terang */}
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

                  {/* Tombol Logout dengan warna merah adaptif */}
                  <button 
                    onClick={() => {
                      alert("Keluar dari akun...");
                      toggleDropdown();
                    }}
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
  );
}

export default Header;