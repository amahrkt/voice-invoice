/**
 * Formats a non-negative integer as Indonesian Rupiah currency string.
 * Uses dot (`.`) as thousands separator, no decimal point.
 *
 * Examples:
 *   formatCurrency(0)        → "Rp 0"
 *   formatCurrency(1000)     → "Rp 1.000"
 *   formatCurrency(1500000)  → "Rp 1.500.000"
 *
 * Requirements: 6.6
 */
export function formatCurrency(n: number): string {
  const formatted = Math.trunc(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}
