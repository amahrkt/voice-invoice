import type { AnalyticsBucket, AnalyticsPeriod } from '@/types/analytics';

/**
 * Returns the ISO week number (1–53) for a given Date.
 * Uses the ISO 8601 definition: week starts on Monday,
 * and the first week contains the year's first Thursday.
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1 … Sun=7)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/**
 * Returns the ISO year that owns the given week.
 * This may differ from `date.getFullYear()` for dates in early January
 * or late December.
 */
function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
}

/**
 * Builds a bucket label for the given date and period.
 * - day   → "YYYY-MM-DD"  (e.g. "2025-07-23")
 * - week  → "YYYY-WNN"    (e.g. "2025-W29")  — ISO week, zero-padded
 * - month → "YYYY-MM"     (e.g. "2025-07")
 */
function getBucketLabel(date: Date, period: AnalyticsPeriod): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (period) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week': {
      const isoYear = getISOWeekYear(date);
      const week = String(getISOWeek(date)).padStart(2, '0');
      return `${isoYear}-W${week}`;
    }
    case 'month':
      return `${year}-${month}`;
  }
}

/**
 * Groups an array of invoice summaries into analytics buckets.
 *
 * @param invoices - Array of objects with `tanggalWaktu` and `totalKeseluruhan`.
 * @param period   - Grouping granularity: 'day' | 'week' | 'month'.
 * @returns        - Array of `AnalyticsBucket` sorted by label ascending.
 *
 * Pure function — no side effects, no database access.
 */
export function groupByPeriod(
  invoices: Array<{ tanggalWaktu: Date; totalKeseluruhan: number }>,
  period: AnalyticsPeriod,
): AnalyticsBucket[] {
  const map = new Map<string, AnalyticsBucket>();

  for (const invoice of invoices) {
    const label = getBucketLabel(invoice.tanggalWaktu, period);

    const existing = map.get(label);
    if (existing) {
      existing.totalPendapatan += invoice.totalKeseluruhan;
      existing.jumlahTransaksi += 1;
    } else {
      map.set(label, {
        label,
        totalPendapatan: invoice.totalKeseluruhan,
        jumlahTransaksi: 1,
      });
    }
  }

  // Return sorted by label (lexicographic order works for all three formats)
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}
