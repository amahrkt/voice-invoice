/**
 * Fuzzy product matcher using PostgreSQL trigram pre-filter (pg_trgm)
 * followed by TypeScript Levenshtein re-ranking.
 *
 * Requirements: 4.2, 4.3
 */

import { PrismaClient } from "@/generated/prisma/client";
import { ProductCandidate } from "@/types/invoice";

/**
 * Normalize a string for fuzzy comparison:
 * lowercase, trim leading/trailing whitespace, collapse internal whitespace to single spaces.
 */
export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Compute the Levenshtein distance between two strings.
 * Implemented inline — no external library required.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use a single row rolling array for O(min(m,n)) space
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
    }
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
    }
  }

  return prev[n];
}

/**
 * Row shape returned by the raw trigram SQL query.
 */
interface TrigramRow {
  id: string;
  nama: string;
  harga: number | bigint;
  score: number;
}

/**
 * Search the product catalog for candidates matching `query`.
 *
 * Step 1 — PostgreSQL trigram pre-filter: retrieves up to 10 rows whose
 *           `namaNormal` exceeds the default pg_trgm similarity threshold (0.3).
 *
 * Step 2 — Levenshtein re-rank: drops any row whose edit distance from the
 *           normalized query exceeds 2, then sorts by distance ascending,
 *           breaking ties by trigram score descending.
 *
 * Decision output:
 *   0 candidates → return [] (NOT_FOUND)
 *   1 candidate  → return [candidate] (OK)
 *   2–5          → return all (AMBIGUOUS)
 *   >5           → return top 5 (AMBIGUOUS, capped)
 *
 * @param query   Raw query string (will be normalized internally).
 * @param prisma  PrismaClient instance.
 * @returns       Up to 5 ProductCandidate objects, sorted by best match first.
 */
export async function fuzzySearch(
  query: string,
  prisma: PrismaClient
): Promise<ProductCandidate[]> {
  const normalizedQuery = normalize(query);

  // Step 1: trigram pre-filter via raw SQL (pg_trgm must be installed)
  const rows = await prisma.$queryRaw<TrigramRow[]>`
    SELECT id, nama, harga,
           similarity("namaNormal", ${normalizedQuery}) AS score
    FROM "Product"
    WHERE "namaNormal" % ${normalizedQuery}
    ORDER BY score DESC
    LIMIT 10
  `;

  // Step 2: Levenshtein re-rank — drop candidates with distance > 2
  const withDistance = rows
    .map((row) => ({
      id: row.id,
      nama: row.nama,
      harga: Number(row.harga),
      score: row.score,
      distance: levenshtein(normalizedQuery, normalize(row.nama)),
    }))
    .filter((c) => c.distance <= 2);

  // Sort: ascending distance, then descending trigram score as tiebreaker
  withDistance.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.score - a.score;
  });

  // Cap at 5 and drop the internal `distance` field before returning
  const candidates: ProductCandidate[] = withDistance
    .slice(0, 5)
    .map(({ id, nama, harga, score }) => ({ id, nama, harga, score }));

  return candidates;
}
