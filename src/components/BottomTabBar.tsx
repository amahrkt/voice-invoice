'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// 1. Tambahkan ikon Printer dari lucide-react di sini
import { Mic, Package, History, BarChart2, Printer } from 'lucide-react';

// 2. Sisipkan menu Print di dalam array TABS
const TABS = [
  { href: '/invoice',   label: 'Record',    Icon: Mic       },
  { href: '/print',     label: 'Print',     Icon: Printer   }, // <-- Ini menu barumu
  { href: '/products',  label: 'Products',  Icon: Package   },
  { href: '/history',   label: 'History',   Icon: History   },
  { href: '/analytics', label: 'Analytics', Icon: BarChart2 },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <ul className="flex items-stretch justify-around max-w-2xl mx-auto md:max-w-3xl lg:max-w-5xl">
        {TABS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={[
                  'flex flex-col items-center justify-center gap-0.5',
                  'py-2 px-1 w-full',
                  'text-xs sm:text-sm',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                  className="sm:w-6 sm:h-6"
                />
                <span className="leading-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}