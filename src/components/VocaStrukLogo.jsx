import React from 'react';

// Komponen Ikon Aplikasi - Berdasarkan Sketsa Oval & Gelombang Suara
const VocaStrukLogo = ({ size = 42, className = "" }) => {
  // Karena bentuknya oval memanjang, lebarnya diset 2x dari tinggi (size)
  const width = size * 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={size}
      viewBox="0 0 100 50"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 1. Garis Lingkar Luar (Oval) */}
      <ellipse cx="50" cy="25" rx="46" ry="22" />

      {/* 2. Mikrofon di Tengah */}
      {/* Kapsul Mic */}
      <rect x="45" y="15" width="10" height="14" rx="5" />
      {/* Gagang Penahan Mic */}
      <path d="M40 23v3a10 10 0 0 0 20 0v-3" />
      {/* Tiang & Kaki Mic */}
      <line x1="50" y1="36" x2="50" y2="41" />
      <line x1="43" y1="41" x2="57" y2="41" />

      {/* 3. Garis Indikator Suara di Atas Mic */}
      <line x1="50" y1="11" x2="50" y2="7" />
      <line x1="44" y1="12" x2="41" y2="9" />
      <line x1="56" y1="12" x2="59" y2="9" />

      {/* 4. Gelombang Suara (Kiri) */}
      <line x1="15" y1="23" x2="15" y2="27" />
      <line x1="22" y1="18" x2="22" y2="32" />
      <line x1="29" y1="14" x2="29" y2="36" />
      <line x1="35" y1="19" x2="35" y2="31" />

      {/* 5. Gelombang Suara (Kanan) */}
      <line x1="65" y1="19" x2="65" y2="31" />
      <line x1="71" y1="14" x2="71" y2="36" />
      <line x1="78" y1="18" x2="78" y2="32" />
      <line x1="85" y1="23" x2="85" y2="27" />
    </svg>
  );
};

export default VocaStrukLogo;