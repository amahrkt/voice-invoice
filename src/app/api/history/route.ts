/**
 * GET /api/history
 *
 * Mengembalikan semua invoice beserta item-nya, diurutkan berdasarkan
 * tanggalWaktu secara descending (terbaru lebih dulu).
 *
 * Response (200):
 * {
 *   "invoices": HistoryInvoice[],
 *   "total": number
 * }
 *
 * Requirements: 7.3, 3.1, 3.2, 3.3
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { HistoryInvoice } from "@/types/history";

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await prisma.invoice.findMany({
      orderBy: { tanggalWaktu: "desc" },
      include: { items: true },
    });

    // Map Prisma records to the HistoryInvoice shape expected by the frontend
    const invoices: HistoryInvoice[] = rows.map((invoice) => ({
      id: invoice.id,
      nomorInvoice: invoice.nomorInvoice,
      tanggalWaktu: invoice.tanggalWaktu.toISOString(),
      totalKeseluruhan: invoice.totalKeseluruhan,
      items: invoice.items.map((item) => ({
        id: item.id,
        namaBarang: item.namaBarang,
        kuantitas: item.kuantitas,
        hargaSatuan: item.hargaSatuan,
        subtotal: item.subtotal,
        status: item.status as "OK" | "NOT_FOUND" | "AMBIGUOUS",
      })),
    }));

    return NextResponse.json(
      { invoices, total: invoices.length },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[GET /api/history]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
