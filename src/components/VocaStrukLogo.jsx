import React from 'react';

// Komponen Ikon Aplikasi VocaStruk (Modern, Flat Vector, AI Voice Invoice)
const VocaStrukLogo = ({ size = 48, className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <defs>
        {/* Gradasi warna latar belakang ikon (Biru ke Cyan) */}
        <linearGradient id="appIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" /> {/* Blue-700 */}
          <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan-500 */}
        </linearGradient>
      </defs>

      {/* 1. Latar Belakang Aplikasi (Rounded Rectangle) */}
      <rect width="24" height="24" rx="5.5" fill="url(#appIconGrad)" />

      {/* 2. Sirkuit AI (Tampil halus/subtle di latar belakang) */}
      <path d="M2 11h2.5l2-2" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="9" r="0.75" fill="#ffffff" fillOpacity="0.6" />
      
      <path d="M22 15h-2.5l-2 2" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17.5" cy="17" r="0.75" fill="#ffffff" fillOpacity="0.6" />

      {/* 3. Kertas Faktur / Invoice (Putih solid di tengah) */}
      <path 
        d="M7.5 4h6.5l4 4v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5v-14A1.5 1.5 0 0 1 7.5 4z" 
        fill="#ffffff" 
        style={{ filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))" }}
      />
      {/* Lipatan ujung kertas faktur di pojok kanan atas */}
      <path d="M14 4v4h4" fill="#E2E8F0" />
      {/* Garis teks samar di atas faktur */}
      <line x1="8.5" y1="6.5" x2="11.5" y2="6.5" stroke="#CBD5E1" strokeWidth="1" strokeLinecap="round" />

      {/* 4. Mikrofon (Bertumpuk di atas kertas faktur) */}
      {/* Kapsul Mic */}
      <rect x="10.5" y="9.5" width="3" height="4.5" rx="1.5" fill="#2563EB" /> {/* Blue-600 */}
      {/* Gagang/U-Bracket Mic */}
      <path 
        d="M8.5 12v.5a3.5 3.5 0 0 0 7 0V12" 
        stroke="#0891B2" /* Cyan-600 */
        strokeWidth="1.25" 
        strokeLinecap="round" 
      />
      {/* Tiang & Alas Mic */}
      <path 
        d="M12 16v2M10 18h4" 
        stroke="#0891B2" 
        strokeWidth="1.25" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

export default VocaStrukLogo;