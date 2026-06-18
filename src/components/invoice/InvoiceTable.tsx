"use client";

/**
 * InvoiceTable component — renders three tabs: Invoice, Pick List, and Packing List.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.3, 7.4, 8.2, 8.3, 8.4, 10.4, 10.5
 */

import { useState } from "react";
import {
  AlertTriangle,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import type { InvoiceResponse, ItemLine } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatCurrency";
import { recalculate } from "@/lib/invoiceEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceTableProps {
  invoice: InvoiceResponse | null;
  transcript: string;
  onEditLine: (index: number, updated: Partial<ItemLine>) => void;
  onDeleteLine: (index: number) => void;
}

type ActiveTab = "invoice" | "picklist" | "packing";

interface EditState {
  index: number;
  namaBarang: string;
  kuantitas: string;
  hargaSatuan: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats an ISO 8601 date string to Indonesian date and time strings.
 * Returns { tanggal: "DD/MM/YYYY", waktu: "HH:MM" }
 */
function formatTanggalWaktu(isoString: string): { tanggal: string; waktu: string } {
  const date = new Date(isoString);
  const tanggal = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const waktu = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { tanggal, waktu };
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat invoice…"
      className="w-full animate-pulse space-y-4 p-6"
    >
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-gray-200" />
        ))}
      </div>
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="h-4 w-36 rounded bg-gray-200" />
      </div>
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="h-10 w-full bg-gray-100" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 border-t border-gray-100 p-3">
            <div className="h-4 w-6 rounded bg-gray-200" />
            <div className="h-4 flex-1 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab Invoice ───────────────────────────────────────────────────────────────

interface TabInvoiceProps {
  invoice: InvoiceResponse;
  transcript: string;
  onEditLine: (index: number, updated: Partial<ItemLine>) => void;
  onDeleteLine: (index: number) => void;
}

function TabInvoice({ invoice, transcript, onEditLine, onDeleteLine }: TabInvoiceProps) {
  const [editState, setEditState] = useState<EditState | null>(null);

  const { tanggal, waktu } = formatTanggalWaktu(invoice.tanggalWaktu);

  function startEdit(index: number, line: ItemLine) {
    setEditState({
      index,
      namaBarang: line.namaBarang,
      kuantitas: String(line.kuantitas),
      hargaSatuan: String(line.hargaSatuan),
    });
  }

  function cancelEdit() {
    setEditState(null);
  }

  function saveEdit() {
    if (!editState) return;

    const kuantitas = parseInt(editState.kuantitas, 10);
    const hargaSatuan = parseInt(editState.hargaSatuan, 10);

    if (
      !editState.namaBarang.trim() ||
      isNaN(kuantitas) ||
      kuantitas < 1 ||
      isNaN(hargaSatuan) ||
      hargaSatuan < 0
    ) {
      return; // keep edit form open on invalid input
    }

    onEditLine(editState.index, {
      namaBarang: editState.namaBarang.trim(),
      kuantitas,
      hargaSatuan,
      status: "OK", // edited rows are considered resolved
    });
    setEditState(null);
  }

  return (
    <div className="space-y-4">
      {/* ── Transcript panel (Req 6.5) ── */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Transkripsi Suara
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {transcript || <span className="italic text-gray-400">—</span>}
        </p>
      </div>

      {/* ── Invoice header (Req 6.3) ── */}
      <div className="space-y-0.5">
        <p className="text-base font-semibold text-gray-900">{invoice.nomorInvoice}</p>
        <p className="text-sm text-gray-500">
          {tanggal} &bull; {waktu}
        </p>
      </div>

      {/* ── Invoice table (Req 6.1) ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium w-10">No</th>
              <th className="px-3 py-2.5 text-left font-medium">Nama Produk</th>
              <th className="px-3 py-2.5 text-right font-medium w-20">Kuantitas</th>
              <th className="px-3 py-2.5 text-right font-medium w-32">Harga Satuan</th>
              <th className="px-3 py-2.5 text-right font-medium w-32">Subtotal</th>
              <th className="px-3 py-2.5 text-center font-medium w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.itemLines.map((line, index) => {
              const isNotFound = line.status === "NOT_FOUND";
              const isEditing = editState?.index === index;

              if (isEditing && editState) {
                return (
                  <tr key={index} className="bg-blue-50">
                    <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                    {/* Inline edit form */}
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={editState.namaBarang}
                        onChange={(e) =>
                          setEditState({ ...editState, namaBarang: e.target.value })
                        }
                        className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label="Nama produk"
                        placeholder="Nama produk"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={editState.kuantitas}
                        min={1}
                        onChange={(e) =>
                          setEditState({ ...editState, kuantitas: e.target.value })
                        }
                        className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label="Kuantitas"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={editState.hargaSatuan}
                        min={0}
                        onChange={(e) =>
                          setEditState({ ...editState, hargaSatuan: e.target.value })
                        }
                        className="w-full rounded border border-blue-300 bg-white px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label="Harga satuan"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400 text-xs italic">—</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 active:scale-95 transition-all"
                          aria-label="Simpan perubahan"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 active:scale-95 transition-all"
                          aria-label="Batal edit"
                        >
                          Batal
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={index}
                  className={isNotFound ? "bg-red-50" : "hover:bg-gray-50"}
                >
                  <td className={`px-3 py-2.5 ${isNotFound ? "text-red-600" : "text-gray-500"}`}>
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5">
                    {isNotFound ? (
                      /* Req 6.4: NOT_FOUND rows — red text + warning icon */
                      <span
                        className="flex items-center gap-1.5 text-red-600"
                        role="alert"
                        aria-label={`Produk tidak ditemukan: ${line.namaBarang}`}
                      >
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        {line.namaBarang}
                      </span>
                    ) : (
                      <span className="text-gray-900">{line.namaBarang}</span>
                    )}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right ${
                      isNotFound ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {line.kuantitas}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right ${
                      isNotFound ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {/* Req 6.6: format with formatCurrency */}
                    {isNotFound ? "—" : formatCurrency(line.hargaSatuan)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right ${
                      isNotFound ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {isNotFound ? "—" : formatCurrency(line.subtotal)}
                  </td>
                  <td className="px-3 py-2.5">
                    {/* Req 10.4: Edit and Delete buttons on each row */}
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(index, line)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                        aria-label={`Edit baris ${index + 1}: ${line.namaBarang}`}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteLine(index)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label={`Hapus baris ${index + 1}: ${line.namaBarang}`}
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Req 6.2: Total row */}
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
              <td colSpan={4} className="px-3 py-2.5 text-right text-gray-700">
                Total
              </td>
              <td className="px-3 py-2.5 text-right text-gray-900">
                {formatCurrency(invoice.totalKeseluruhan)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Tab Pick List ─────────────────────────────────────────────────────────────

interface TabPickListProps {
  invoice: InvoiceResponse;
}

function TabPickList({ invoice }: TabPickListProps) {
  return (
    <div className="space-y-4">
      {/* Req 7.4: Header with nomorInvoice */}
      <div>
        <p className="text-base font-semibold text-gray-900">{invoice.nomorInvoice}</p>
        <p className="text-xs text-gray-500">Pick List</p>
      </div>

      {invoice.pickList.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Tidak ada item untuk diambil.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" role="list">
          {invoice.pickList.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm text-gray-900">{item.namaBarang}</span>
              <span className="ml-4 text-sm font-medium text-gray-700">
                ×{item.kuantitas}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tab Packing List ──────────────────────────────────────────────────────────

interface TabPackingListProps {
  invoice: InvoiceResponse;
}

function TabPackingList({ invoice }: TabPackingListProps) {
  // Req 8.2: Local checkbox state — no backend sync needed
  const [checked, setChecked] = useState<boolean[]>(() =>
    invoice.packingList.map(() => false)
  );

  const { tanggal, waktu } = formatTanggalWaktu(invoice.tanggalWaktu);

  function toggleChecked(index: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Req 8.3: Header with nomorInvoice; Req 8.4: with tanggalWaktu */}
      <div>
        <p className="text-base font-semibold text-gray-900">{invoice.nomorInvoice}</p>
        <p className="text-sm text-gray-500">
          Packing List &bull; {tanggal} {waktu}
        </p>
      </div>

      {invoice.packingList.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Tidak ada item untuk dikemas.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200" role="list">
          {invoice.packingList.map((item, index) => (
            <li key={index} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => toggleChecked(index)}
                className="flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label={
                  checked[index]
                    ? `Tandai belum dikemas: ${item.namaBarang}`
                    : `Tandai sudah dikemas: ${item.namaBarang}`
                }
                aria-pressed={checked[index]}
              >
                {checked[index] ? (
                  <CheckSquare className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                ) : (
                  <Square className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  checked[index] ? "text-gray-400 line-through" : "text-gray-900"
                }`}
              >
                {item.namaBarang}
              </span>
              <span className="text-sm font-medium text-gray-700">×{item.kuantitas}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function InvoiceTable({
  invoice,
  transcript,
  onEditLine,
  onDeleteLine,
}: InvoiceTableProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("invoice");

  // Req 6.7: Loading skeleton when invoice is null
  if (invoice === null) {
    return <LoadingSkeleton />;
  }

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "invoice", label: "Invoice" },
    { id: "picklist", label: "Pick List" },
    { id: "packing", label: "Packing List" },
  ];

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ── Tab bar ── */}
      <div
        className="flex gap-1 border-b border-gray-200 px-4 pt-3"
        role="tablist"
        aria-label="Pilihan dokumen"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              activeTab === tab.id
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      <div className="p-4 md:p-6">
        {activeTab === "invoice" && (
          <div
            role="tabpanel"
            id="tabpanel-invoice"
            aria-labelledby="tab-invoice"
          >
            <TabInvoice
              invoice={invoice}
              transcript={transcript}
              onEditLine={(index, updated) => {
                // Req 10.5: call parent's onEditLine; parent will call recalculate()
                onEditLine(index, updated);
              }}
              onDeleteLine={onDeleteLine}
            />
          </div>
        )}

        {activeTab === "picklist" && (
          <div
            role="tabpanel"
            id="tabpanel-picklist"
            aria-labelledby="tab-picklist"
          >
            <TabPickList invoice={invoice} />
          </div>
        )}

        {activeTab === "packing" && (
          <div
            role="tabpanel"
            id="tabpanel-packing"
            aria-labelledby="tab-packing"
          >
            <TabPackingList invoice={invoice} />
          </div>
        )}
      </div>
    </div>
  );
}
