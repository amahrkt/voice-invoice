'use client';

import { useState, useEffect } from 'react';
import { settingsDictionaries } from '@/dictionaries/settings';

export default function Home() {
  const [language, setLanguage] = useState<'id' | 'en'>('id');

  // Baca pilihan bahasa dari localStorage saat halaman utama dimuat
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language') as 'id' | 'en';
    if (savedLanguage === 'id' || savedLanguage === 'en') {
      setLanguage(savedLanguage);
    }
  }, []);

  const t = settingsDictionaries[language];

  return (
    <>
      <div className="main-heading">
        {/* Teks dinamis sesuai dengan bahasa yang dipilih */}
        <h1>{t.homeTitle}</h1>
        <p className="subtitle">
          {t.homeSubtitle}
        </p>
      </div>
    </>
  );
}