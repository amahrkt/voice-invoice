/**
 * GET /api/products?q=<term>
 *
 * Internal disambiguation endpoint that returns up to 10 product candidates
 * matching the search term. Calls fuzzySearch (which caps at 5) and returns
 * the resulting ProductCandidate[] as a JSON array.
 *
 * Requirements: 4.3
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fuzzySearch } from "@/lib/fuzzyMatch";
import type { AppError, ProductCandidate } from "@/types/invoice";

// ── Logging ───────────────────────────────────────────────────────────────────

function logError(err: AppError): void {
  console.error(
    JSON.stringify({
      timestamp: err.timestamp,
      code: err.code,
      stage: err.stage,
      message: err.message,
    })
  );
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  // Validate that the query param is present and non-empty
  if (!q || q.trim() === "") {
    const err: AppError = {
      code: "PRODUCTS_MISSING_QUERY",
      message: 'Query parameter "q" is required and must not be empty.',
      stage: "invoice",
      timestamp: new Date().toISOString(),
    };
    logError(err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // fuzzySearch normalizes the query internally and caps results at 5
    const candidates: ProductCandidate[] = await fuzzySearch(q, prisma);

    return NextResponse.json(candidates, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    const isConnectionError =
      message.toLowerCase().includes("connect") ||
      message.toLowerCase().includes("econnrefused") ||
      message.toLowerCase().includes("connection");

    const code = isConnectionError ? "DB_CONNECTION_ERROR" : "PRODUCTS_SEARCH_FAILED";
    const status = isConnectionError ? 503 : 500;

    const err: AppError = {
      code,
      message,
      stage: "db",
      timestamp: new Date().toISOString(),
    };
    logError(err);
    return NextResponse.json({ error: message, code }, { status });
  }
}
