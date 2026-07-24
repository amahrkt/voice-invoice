/**
 * PUT /api/products/[id]   — Update produk berdasarkan id
 * DELETE /api/products/[id] — Hapus produk berdasarkan id
 *
 * Requirements: 7.2, 7.5, 7.6
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { generateNamaNormal } from "@/lib/generateNamaNormal";

// ── Zod Schema ────────────────────────────────────────────────────────────────

const UpdateProductSchema = z.object({
  nama: z.string().min(1).trim().optional(),
  harga: z.number().int().positive().optional(),
  stok: z.number().int().min(0).optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Deteksi Prisma error P2025 (record not found).
 */
function isPrismaNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2025"
  );
}

// ── PUT /api/products/[id] ────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body harus berupa JSON yang valid" },
      { status: 400 }
    );
  }

  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Jika nama diubah, regenerasi namaNormal secara otomatis
  const updatePayload: {
    nama?: string;
    namaNormal?: string;
    harga?: number;
    stok?: number;
  } = { ...data };

  if (data.nama !== undefined) {
    updatePayload.namaNormal = generateNamaNormal(data.nama);
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: updatePayload,
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error: unknown) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/products/[id] ─────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Produk berhasil dihapus" },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (isPrismaNotFound(error)) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
