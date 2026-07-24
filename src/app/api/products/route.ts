/**
 * GET /api/products
 *   - Without ?q=  : returns all products sorted by nama (for Products page)
 *   - With ?q=<term>: returns fuzzy-search candidates (for invoice disambiguation)
 *
 * POST /api/products
 *   - Creates a new product; validates body with Zod CreateProductSchema.
 *
 * Requirements: 4.3, 7.1, 7.2, 7.5, 7.6
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { fuzzySearch } from "@/lib/fuzzyMatch";
import { generateNamaNormal } from "@/lib/generateNamaNormal";
import type { AppError, ProductCandidate } from "@/types/invoice";

// ── Schemas ───────────────────────────────────────────────────────────────────

const CreateProductSchema = z.object({
  nama: z.string().trim().min(1, "Nama tidak boleh kosong"),
  harga: z.number().int().positive("Harga harus lebih dari 0"),
  stok: z.number().int().min(0, "Stok tidak boleh negatif"),
});

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

// ── GET Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  // If ?q= is absent or empty, return all products sorted by nama
  if (!q || q.trim() === "") {
    try {
      const products = await prisma.product.findMany({
        orderBy: { nama: "asc" },
      });
      return NextResponse.json(products, { status: 200 });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      const err: AppError = {
        code: "PRODUCTS_LIST_FAILED",
        message,
        stage: "db",
        timestamp: new Date().toISOString(),
      };
      logError(err);
      return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
    }
  }

  // ?q= is present — run existing fuzzy search logic
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

// ── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body permintaan tidak valid" }, { status: 400 });
  }

  // Validate with Zod
  const parseResult = CreateProductSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0].message;
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { nama, harga, stok } = parseResult.data;
  const namaNormal = generateNamaNormal(nama);

  try {
    const product = await prisma.product.create({
      data: { nama, namaNormal, harga, stok },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    const err: AppError = {
      code: "PRODUCTS_CREATE_FAILED",
      message,
      stage: "db",
      timestamp: new Date().toISOString(),
    };
    logError(err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
