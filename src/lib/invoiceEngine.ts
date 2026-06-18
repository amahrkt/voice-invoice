/**
 * Invoice computation module — pure functions for subtotal/total recalculation,
 * pick list construction, packing list construction, and full InvoiceResponse assembly.
 *
 * All arithmetic uses integer Rupiah values (no floating-point).
 * Requirements: 5.1, 5.2, 5.3, 5.5, 7.1, 7.2, 8.1
 */

import type {
  InvoiceResponse,
  ItemLine,
  PickListItem,
  PackingListItem,
} from "@/types/invoice";

/**
 * Recomputes each ItemLine's subtotal and the overall total.
 *
 * - OK lines: subtotal = hargaSatuan × kuantitas (integer multiplication)
 * - NOT_FOUND / AMBIGUOUS lines: subtotal = 0
 * - totalKeseluruhan = sum of subtotals for lines where status !== "NOT_FOUND"
 *
 * Requirements: 5.1, 5.2
 */
export function recalculate(invoice: InvoiceResponse): InvoiceResponse {
  const items: ItemLine[] = invoice.itemLines.map((line) => ({
    ...line,
    subtotal: line.status === "OK" ? Math.trunc(line.hargaSatuan) * Math.trunc(line.kuantitas) : 0,
  }));

  const totalKeseluruhan = items
    .filter((l) => l.status !== "NOT_FOUND")
    .reduce((sum, l) => sum + l.subtotal, 0);

  return { ...invoice, itemLines: items, totalKeseluruhan };
}

/**
 * Builds a pick list by:
 * 1. Filtering out items with status "NOT_FOUND"
 * 2. Sorting alphabetically by namaBarang using locale "id-ID"
 *
 * Requirements: 7.1, 7.2
 */
export function buildPickList(items: ItemLine[]): PickListItem[] {
  return items
    .filter((item) => item.status !== "NOT_FOUND")
    .map(({ namaBarang, kuantitas }) => ({ namaBarang, kuantitas }))
    .sort((a, b) => a.namaBarang.localeCompare(b.namaBarang, "id-ID"));
}

/**
 * Builds a packing list from a pick list.
 * Every entry mirrors the pick list but adds packed: false.
 *
 * Requirements: 8.1
 */
export function buildPackingList(pickList: PickListItem[]): PackingListItem[] {
  return pickList.map(({ namaBarang, kuantitas }) => ({
    namaBarang,
    kuantitas,
    packed: false,
  }));
}

/**
 * Assembles a complete InvoiceResponse from its component parts.
 *
 * The itemLines passed in should already have statuses set (OK / NOT_FOUND / AMBIGUOUS).
 * This function runs recalculate() to ensure all subtotals and totalKeseluruhan are correct,
 * then builds the pick list and packing list before returning the final object.
 *
 * Requirements: 5.3, 5.5
 */
export function buildInvoiceResponse(params: {
  nomorInvoice: string;
  tanggalWaktu: string; // ISO 8601
  transcript: string;
  itemLines: ItemLine[];
}): InvoiceResponse {
  const { nomorInvoice, tanggalWaktu, transcript, itemLines } = params;

  // Start with a draft so recalculate() has a full InvoiceResponse to operate on.
  const draft: InvoiceResponse = {
    nomorInvoice,
    tanggalWaktu,
    transcript,
    itemLines,
    totalKeseluruhan: 0,
    pickList: [],
    packingList: [],
  };

  const recalculated = recalculate(draft);
  const pickList = buildPickList(recalculated.itemLines);
  const packingList = buildPackingList(pickList);

  return {
    ...recalculated,
    pickList,
    packingList,
  };
}
