'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Globe } from 'lucide-react';
import { settingsDictionaries } from '@/dictionaries/settings';

export default function SettingsPage() {
  const [language, setLanguage] = useState<'id' | 'en'>('id');

  // Efek untuk membaca bahasa yang tersimpan di localStorage saat halaman pertama kali dibuka
  useEffect(() => {
    const savedLanguage = localStorage.getItem('app_language') as 'id' | 'en';
    if (savedLanguage === 'id' || savedLanguage === 'en') {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as 'id' | 'en';
    setLanguage(newLang);
    // Simpan pilihan bahasa ke localStorage browser
    localStorage.setItem('app_language', newLang);
    
    // Memicu event custom agar halaman lain tahu ada perubahan bahasa
    window.dispatchEvent(new Event('languageChange'));
  };

  const t = settingsDictionaries[language];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        {t.title}
      </h1>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        {t.subtitle}
      </p>

      <div className="space-y-6">
        {/* 1. Pengaturan Tema */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-800 dark:text-gray-100">
            {t.themeTitle}
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {t.themeDesc}
          </p>
          <ThemeToggle />
        </section>

        {/* 2. Pengaturan Bahasa */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={20} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {t.langTitle}
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {t.langDesc}
          </p>
          
          <div className="relative inline-block w-48">
            <select
              value={language}
              onChange={handleLanguageChange}
              className="block w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-sm transition-colors"
            >
              <option value="id">🇮🇩 Indonesia</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}