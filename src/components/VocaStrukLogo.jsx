import React from 'react';

// Komponen Logo Kustom VocaStruk
// Perpaduan Ikon Cari, Mic Voice, dan Struk Kertas
const VocaStrukLogo = ({ size = 24, className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 1. Ikon Pencarian - Lingkaran Utama */}
      <circle cx="10" cy="10" r="7" />
      {/* Gagang Pencarian yang dimodifikasi */}
      <line x1="21" y1="21" x2="15" y2="15" />

      {/* 2. Mikrofon (Mic) - Bagian Kapsul di dalam lingkaran */}
      <path d="M8.5 7.5a1.5 1.5 0 0 1 3 0v2a1.5 1.5 0 0 1-3 0v-2z" />
      {/* Bagian Bawah Mic */}
      <path d="M7 10a3 3 0 0 0 6 0" />
      {/* Stand Mic kecil */}
      <line x1="10" x2="10" y1="13" y2="15" />

      {/* 3. Struk (Receipt) - Terlihat menyatu dengan gagang pencarian di bawah */}
      <path d="M15 15h3v5l-1.5-1.5L15 20v-5z" />
      {/* Garis-garis tulisan kecil di struk */}
      <path d="M10 17h5" />
    </svg>
  );
};

export default VocaStrukLogo;