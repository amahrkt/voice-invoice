/**
 * Menghasilkan nama normal (canonical form) dari nama produk.
 * Logika: lowercase, trim whitespace di awal/akhir, kolaps whitespace internal.
 *
 * Fungsi ini adalah pure function — tidak bergantung pada state eksternal
 * dan idempoten: generateNamaNormal(generateNamaNormal(nama)) === generateNamaNormal(nama)
 *
 * Requirements: 2.7
 */
export function generateNamaNormal(nama: string): string {
  return nama.toLowerCase().trim().replace(/\s+/g, ' ');
}
