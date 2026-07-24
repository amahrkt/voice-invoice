/**
 * POST /api/invoice
 *
 * Accepts an InvoiceRequest (items[], sessionId, transcript), performs fuzzy
 * product search for every item in parallel, builds ItemLine[] with appropriate
 * statuses (OK / AMBIGUOUS / NOT_FOUND), then assembles and persists an Invoice
 * atomically via a Prisma interactive transaction before returning a complete
 * InvoiceResponse.
 *
 * Requirements: 4.1, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1, 7.2, 8.1,
 *               10.1, 10.3
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { fuzzySearch } from "@/lib/fuzzyMatch";
import { generateInvoiceNumber } from "@/lib/invoiceNumber";
import { buildInvoiceResponse } from "@/lib/invoiceEngine";
import type {
  AppError,
  ItemLine,
  ParsedItem,
  InvoiceResponse,
} from "@/types/invoice";

// ItemStatus is imported from the generated Prisma enums once the schema
// migration (Task 2) has been applied and `npx prisma generate` is run.
// Until then we define a local alias that matches the enum values in the schema.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ItemStatus } from "@/generated/prisma/enums";

// ── Logging ───────────────────────────────────────────────────────────────────

function logError(err: AppError): void {
  console.error(
    JSON.stringify({
      timestamp: err.timestamp,
      code: err.code,
      stage: err.stage,
      sessionId: err.sessionId,
      message: err.message,
    })
  );
}

// ── Input validation schema ───────────────────────────────────────────────────

const ParsedItemSchema = z.object({
  namaBarang: z.string().min(1),
  kuantitas: z.number().int().min(1),
});

const InvoiceRequestSchema = z.object({
  items: z.array(ParsedItemSchema).min(1, "items must be a non-empty array"),
  sessionId: z.string(),
  transcript: z.string().default(""),
});

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let sessionId: string | undefined;

  try {
    // Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const err: AppError = {
        code: "INVOICE_INVALID_REQUEST",
        message: "Request body must be valid JSON.",
        stage: "invoice",
        timestamp: new Date().toISOString(),
      };
      logError(err);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Validate input
    const inputResult = InvoiceRequestSchema.safeParse(body);
    if (!inputResult.success) {
      const message = (inputResult.error.issues ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => `${(e.path ?? []).join(".")}: ${e.message}`)
        .join("; ");
      const err: AppError = {
        code: "INVOICE_INVALID_REQUEST",
        message,
        stage: "invoice",
        timestamp: new Date().toISOString(),
      };
      logError(err);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { items, sessionId: sid, transcript } = inputResult.data;
    sessionId = sid;

    // ── Step 1: Fuzzy search for all items in parallel (Requirement 4.1, 4.5) ──
    const searchResults = await Promise.all(
      items.map((item: ParsedItem) => fuzzySearch(item.namaBarang, prisma))
    );

    // ── Step 2: Build ItemLine[] based on candidate counts (Req 4.3, 4.4) ──────
    const itemLines: ItemLine[] = items.map((item: ParsedItem, index: number) => {
      const candidates = searchResults[index];
      const count = candidates.length;

      if (count === 0) {
        // NOT_FOUND: no matching product
        return {
          namaBarang: item.namaBarang,
          kuantitas: item.kuantitas,
          hargaSatuan: 0,
          subtotal: 0,
          status: "NOT_FOUND" as const,
        };
      } else if (count === 1) {
        // OK: exactly one match — use its price
        const product = candidates[0];
        return {
          namaBarang: product.nama,
          kuantitas: item.kuantitas,
          hargaSatuan: product.harga,
          subtotal: product.harga * item.kuantitas,
          status: "OK" as const,
        };
      } else {
        // AMBIGUOUS: 2–5 candidates — include candidates, zero price until resolved
        return {
          namaBarang: item.namaBarang,
          kuantitas: item.kuantitas,
          hargaSatuan: 0,
          subtotal: 0,
          status: "AMBIGUOUS" as const,
          candidates,
        };
      }
    });

    // ── Step 3: Atomic transaction — generate number, save Invoice + Items ──────
    let savedInvoiceId: string;
    let invoiceResponse: InvoiceResponse;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const txDate = new Date();

        // Generate unique daily invoice number (Requirement 5.6)
        const nomorInvoice = await generateInvoiceNumber(tx, txDate);

        const tanggalWaktu = txDate.toISOString();

        // Assemble the full InvoiceResponse (subtotals, pick list, packing list)
        const response = buildInvoiceResponse({
          nomorInvoice,
          tanggalWaktu,
          transcript,
          itemLines,
        });

        // Persist the Invoice row (Requirement 5.4)
        const invoice = await tx.invoice.create({
          data: {
            nomorInvoice,
            tanggalWaktu: txDate,
            transcript,
            totalKeseluruhan: response.totalKeseluruhan,
            sessionId: sessionId ?? '',
          },
        });

        // Persist all InvoiceItem rows atomically (Requirement 5.4)
        const itemsData = itemLines.map((line: ItemLine, i: number) => ({
          invoiceId: invoice.id,
          // productId: only set for OK items where we know the product id
          productId:
            line.status === "OK"
              ? (searchResults[i]?.[0]?.id ?? null)
              : null,
          namaBarang: line.namaBarang,
          kuantitas: line.kuantitas,
          hargaSatuan: line.hargaSatuan,
          subtotal: line.subtotal,
          status: line.status as ItemStatus,
        }));

        await tx.invoiceItem.createMany({ data: itemsData });

        return { invoice, response };
      });

      savedInvoiceId = result.invoice.id;
      invoiceResponse = result.response;
    } catch (txError: unknown) {
      const message =
        txError instanceof Error ? txError.message : "Transaction failed.";

      // Distinguish connection errors from save failures
      const isConnectionError =
        message.toLowerCase().includes("connect") ||
        message.toLowerCase().includes("econnrefused") ||
        message.toLowerCase().includes("connection");

      const code = isConnectionError
        ? "DB_CONNECTION_ERROR"
        : "INVOICE_SAVE_FAILED";
      const status = isConnectionError ? 503 : 500;

      const err: AppError = {
        code,
        message,
        stage: "db",
        sessionId,
        timestamp: new Date().toISOString(),
      };
      logError(err);
      return NextResponse.json({ error: message, code }, { status });
    }

    // ── Step 4: Return the complete InvoiceResponse ───────────────────────────
    // Suppress unused variable warning — savedInvoiceId retained for traceability
    void savedInvoiceId;

    return NextResponse.json(invoiceResponse, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    const err: AppError = {
      code: "INVOICE_INTERNAL_ERROR",
      message,
      stage: "invoice",
      sessionId,
      timestamp: new Date().toISOString(),
    };
    logError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
