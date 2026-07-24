'use client';

import { useContext } from 'react';
import { ThemeContext } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
      aria-label={`Ganti ke tema ${theme === 'light' ? 'gelap' : 'terang'}`}
    >
      {theme === 'dark' ? (
        <>
          <span aria-hidden="true">☀️</span>
          <span>Terang</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">🌙</span>
          <span>Gelap</span>
        </>
      )}
    </button>
  );
}
