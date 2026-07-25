'use client';

import { useState, useEffect } from 'react';
import { settingsDictionaries } from '@/dictionaries/settings';

export default function AboutPage() {
  // Hapus <'id' | 'en'>, cukup gunakan useState('id')
  const [language, setLanguage] = useState('id');

  useEffect(() => {
    // Hapus as 'id' | 'en', cukup baca langsung dari localStorage
    const savedLanguage = localStorage.getItem('app_language');
    
    if (savedLanguage === 'id' || savedLanguage === 'en') {
      setLanguage(savedLanguage);
    }
  }, []);

  // Ambil teks dari kamus
  const t = settingsDictionaries[language];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-center">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
        {t.aboutTitle}
      </h1>
      
      <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed text-justify sm:text-center max-w-3xl mx-auto">
        {t.aboutContent}
      </p>
    </main>
  );
}