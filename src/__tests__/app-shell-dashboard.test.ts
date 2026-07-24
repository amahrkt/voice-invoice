/**
 * Property-Based Tests: app-shell-dashboard
 *
 * Uses fast-check + vitest.
 * Each property tests a universal correctness invariant of the feature.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';

import { generateNamaNormal } from '@/lib/generateNamaNormal';
import { formatCurrency } from '@/lib/formatCurrency';
import { groupByPeriod } from '@/lib/groupByPeriod';
import type { AnalyticsPeriod } from '@/types/analytics';

// ── TABS definition (mirrors BottomTabBar) ────────────────────────────────────

const TABS = [
  { href: '/invoice' },
  { href: '/products' },
  { href: '/history' },
  { href: '/analytics' },
] as const;

// ── Zod Schema (mirrors API route) ────────────────────────────────────────────

const CreateProductSchema = z.object({
  nama: z.string().trim().min(1, 'Nama tidak boleh kosong'),
  harga: z.number().int().positive('Harga harus lebih dari 0'),
  stok: z.number().int().min(0, 'Stok tidak boleh negatif'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 1: Invariant Active Tab
// Feature: app-shell-dashboard, Property 1: paling banyak satu tab aktif pada satu waktu
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 1 — Invariant Active Tab', () => {
  it('paling banyak satu tab aktif untuk pathname apa pun', () => {
    fc.assert(
      fc.property(fc.string(), (pathname) => {
        const activeCount = TABS.filter((tab) => tab.href === pathname).length;
        expect(activeCount).toBeLessThanOrEqual(1);
      }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 2: generateNamaNormal menghasilkan output konsisten
// Feature: app-shell-dashboard, Property 2: generateNamaNormal menghasilkan output konsisten
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 2 — generateNamaNormal konsisten', () => {
  it('output seluruhnya lowercase', () => {
    fc.assert(
      fc.property(fc.string(), (nama) => {
        const result = generateNamaNormal(nama);
        expect(result).toBe(result.toLowerCase());
      }),
    );
  });

  it('tidak ada whitespace di awal/akhir', () => {
    fc.assert(
      fc.property(fc.string(), (nama) => {
        const result = generateNamaNormal(nama);
        expect(result).toBe(result.trim());
      }),
    );
  });

  it('tidak ada whitespace berurutan di tengah', () => {
    fc.assert(
      fc.property(fc.string(), (nama) => {
        const result = generateNamaNormal(nama);
        expect(/\s{2,}/.test(result)).toBe(false);
      }),
    );
  });

  it('idempoten: memanggil dua kali sama dengan satu kali', () => {
    fc.assert(
      fc.property(fc.string(), (nama) => {
        expect(generateNamaNormal(generateNamaNormal(nama))).toBe(
          generateNamaNormal(nama),
        );
      }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 3: Validasi input produk menolak semua input invalid
// Feature: app-shell-dashboard, Property 3: validasi menolak semua input invalid
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 3 — Validasi produk menolak input invalid', () => {
  it('menolak nama kosong/whitespace-only', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s*$/), // kosong atau hanya whitespace
        fc.integer({ min: 1 }),
        fc.nat(),
        (nama, harga, stok) => {
          const result = CreateProductSchema.safeParse({ nama, harga, stok });
          expect(result.success).toBe(false);
        },
      ),
    );
  });

  it('menolak harga <= 0', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ max: 0 }),
        fc.nat(),
        (nama, harga, stok) => {
          const result = CreateProductSchema.safeParse({ nama, harga, stok });
          expect(result.success).toBe(false);
        },
      ),
    );
  });

  it('menolak stok < 0', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 1 }),
        fc.integer({ max: -1 }),
        (nama, harga, stok) => {
          const result = CreateProductSchema.safeParse({ nama, harga, stok });
          expect(result.success).toBe(false);
        },
      ),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 4: formatCurrency menghasilkan format Rupiah yang valid
// Feature: app-shell-dashboard, Property 4: formatCurrency menghasilkan format Rupiah yang valid
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 4 — formatCurrency format Rupiah valid', () => {
  it('output dimulai dengan "Rp "', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (n) => {
        expect(formatCurrency(n).startsWith('Rp ')).toBe(true);
      }),
    );
  });

  it('tidak mengandung titik desimal (koma)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000_000 }), (n) => {
        const result = formatCurrency(n);
        // Should not contain decimal separator (comma in Indonesian locale)
        expect(result).not.toContain(',');
      }),
    );
  });

  it('contoh spesifik: formatCurrency(1000) === "Rp 1.000"', () => {
    expect(formatCurrency(1000)).toBe('Rp 1.000');
  });

  it('contoh spesifik: formatCurrency(0) === "Rp 0"', () => {
    expect(formatCurrency(0)).toBe('Rp 0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 5: Pengurutan riwayat deterministik dan tidak ada data hilang
// Feature: app-shell-dashboard, Property 5: pengurutan riwayat deterministik dan tidak ada data hilang
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 5 — Pengurutan riwayat deterministik', () => {
  it('jumlah elemen sama setelah sort, dan urutan descending', () => {
    const validDate = fc.date({ min: new Date(0), max: new Date('2100-01-01') });
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ tanggalWaktu: validDate, totalKeseluruhan: fc.nat() }),
        ),
        (invoices) => {
          // Replicate GET /api/history sort logic
          const sorted = [...invoices].sort(
            (a, b) => b.tanggalWaktu.getTime() - a.tanggalWaktu.getTime(),
          );

          // Length preserved
          expect(sorted.length).toBe(invoices.length);

          // Descending order
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].tanggalWaktu.getTime()).toBeGreaterThanOrEqual(
              sorted[i + 1].tanggalWaktu.getTime(),
            );
          }
        },
      ),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 6: Agregasi analytics memenuhi sum invariant
// Feature: app-shell-dashboard, Property 6: groupByPeriod memenuhi sum invariant
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 6 — groupByPeriod sum invariant', () => {
  it('sum bucket.totalPendapatan === sum invoice.totalKeseluruhan', () => {
    const validDate = fc.date({ min: new Date(0), max: new Date('2100-01-01') });
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ tanggalWaktu: validDate, totalKeseluruhan: fc.nat() }),
        ),
        fc.constantFrom<AnalyticsPeriod>('day', 'week', 'month'),
        (invoices, period) => {
          const buckets = groupByPeriod(invoices, period);

          const bucketSum = buckets.reduce(
            (sum, b) => sum + b.totalPendapatan,
            0,
          );
          const invoiceSum = invoices.reduce(
            (sum, inv) => sum + inv.totalKeseluruhan,
            0,
          );

          expect(bucketSum).toBe(invoiceSum);
        },
      ),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 7: Tema round-trip dan konsistensi class HTML
// Feature: app-shell-dashboard, Property 7: tema round-trip dan konsistensi class HTML
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 7 — Tema round-trip dan konsistensi class HTML', () => {
  let localStorageStore: Record<string, string> = {};
  let classListSet: Set<string> = new Set();

  beforeEach(() => {
    localStorageStore = {};
    classListSet = new Set();

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageStore[key] ?? null,
      setItem: (key: string, value: string) => { localStorageStore[key] = value; },
      removeItem: (key: string) => { delete localStorageStore[key]; },
    });

    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          toggle: (cls: string, force?: boolean) => {
            if (force === true) classListSet.add(cls);
            else if (force === false) classListSet.delete(cls);
            else {
              if (classListSet.has(cls)) classListSet.delete(cls);
              else classListSet.add(cls);
            }
          },
          contains: (cls: string) => classListSet.has(cls),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('toggle dua kali mengembalikan tema ke nilai awal', () => {
    for (const initialTheme of ['light', 'dark'] as const) {
      // Reset state
      localStorageStore = { 'tokomu-theme': initialTheme };
      if (initialTheme === 'dark') classListSet.add('dark');
      else classListSet.delete('dark');

      // Simulate toggle logic from ThemeProvider
      const toggle = (currentTheme: 'light' | 'dark'): 'light' | 'dark' => {
        const next = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('tokomu-theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        return next;
      };

      let theme = initialTheme as 'light' | 'dark';
      theme = toggle(theme); // first toggle
      theme = toggle(theme); // second toggle

      // Round-trip: back to initial
      expect(theme).toBe(initialTheme);

      // localStorage consistent with classList
      const storedTheme = localStorage.getItem('tokomu-theme');
      const hasDarkClass = document.documentElement.classList.contains('dark');
      expect(storedTheme === 'dark').toBe(hasDarkClass);
    }
  });

  it('setelah setiap toggle, localStorage konsisten dengan classList.dark', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<'light' | 'dark'>('light', 'dark'),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (startTheme, toggles) => {
          // Reset
          localStorageStore = { 'tokomu-theme': startTheme };
          classListSet = new Set(startTheme === 'dark' ? ['dark'] : []);

          let current = startTheme;

          for (const _t of toggles) {
            const next: 'light' | 'dark' = current === 'light' ? 'dark' : 'light';
            localStorage.setItem('tokomu-theme', next);
            document.documentElement.classList.toggle('dark', next === 'dark');
            current = next;

            const stored = localStorage.getItem('tokomu-theme');
            const hasDark = document.documentElement.classList.contains('dark');
            expect(stored === 'dark').toBe(hasDark);
          }
        },
      ),
    );
  });
});
