"use client";

/**
 * HistoryPage — halaman riwayat transaksi.
 *
 * Menampilkan daftar invoice yang sudah tersimpan, diambil dari GET /api/history.
 * Menampilkan spinner saat loading, error banner jika terjadi kesalahan,
 * dan pesan empty state jika belum ada transaksi.
 *
 * Requirements: 3.1, 3.5, 3.6
 */

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, ClipboardList, ChevronDown, ChevronRight } from "lucide-react";
import type { HistoryInvoice } from "@/types/history";
import { formatCurrency } from "@/lib/formatCurrency";

// ── Component ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [invoices, setInvoices] = useState<HistoryInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // expandedId is kept ready for Task 11.2 accordion implementation
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Fetch on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/history");

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Gagal memuat riwayat (HTTP ${res.status})`
          );
        }

        const data: { invoices: HistoryInvoice[]; total: number } =
          await res.json();

        if (!cancelled) {
          setInvoices(data.invoices);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan yang tidak diketahui"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function formatTanggal(isoString: string): string {
    return new Date(isoString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6">

        {/* ── Page header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Riwayat Transaksi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Semua invoice yang sudah tersimpan
          </p>
        </div>

        {/* ── Loading spinner ── */}
        {loading && (
          <div
            className="flex items-center justify-center py-16"
            aria-label="Memuat riwayat transaksi"
          >
            <Loader2
              className="w-8 h-8 animate-spin text-blue-500"
              aria-hidden="true"
            />
            <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
              Memuat riwayat…
            </span>
          </div>
        )}

        {/* ── Error banner ── */}
        {!loading && error !== null && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 px-4 py-3"
          >
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Gagal memuat riwayat transaksi
              </p>
              <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ── Content: summary + list ── */}
        {!loading && error === null && (
          <>
            {/* ── Transaction count summary ── */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Total:{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {invoices.length} transaksi
                </span>
              </p>
            </div>

            {/* ── Empty state ── */}
            {invoices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
                <ClipboardList
                  className="w-12 h-12 text-gray-300 dark:text-gray-600"
                  aria-hidden="true"
                />
                <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                  Belum ada transaksi yang tersimpan.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Rekam transaksi pertama Anda melalui halaman Record.
                </p>
              </div>
            )}

            {/* ── Invoice list ── */}
            {invoices.length > 0 && (
              <ul className="space-y-3" aria-label="Daftar riwayat transaksi">
                {invoices.map((invoice) => {
                  const isExpanded = expandedId === invoice.id;
                  return (
                    <li
                      key={invoice.id}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden"
                    >
                      {/* ── Invoice header row (clickable) ── */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : invoice.id)
                        }
                        aria-expanded={isExpanded}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        {/* Chevron icon */}
                        {isExpanded ? (
                          <ChevronDown
                            className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500"
                            aria-hidden="true"
                          />
                        ) : (
                          <ChevronRight
                            className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500"
                            aria-hidden="true"
                          />
                        )}

                        {/* Invoice info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {invoice.nomorInvoice}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {formatTanggal(invoice.tanggalWaktu)}
                          </p>
                        </div>

                        {/* Total */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(invoice.totalKeseluruhan)}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                            {invoice.items.length} item
                          </p>
                        </div>
                      </button>

                      {/* ── Expanded items ── */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <th className="text-left pb-2 font-medium">
                                  Barang
                                </th>
                                <th className="text-right pb-2 font-medium">
                                  Qty
                                </th>
                                <th className="text-right pb-2 font-medium">
                                  Harga Satuan
                                </th>
                                <th className="text-right pb-2 font-medium">
                                  Subtotal
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items.map((item) => {
                                const isNotFound =
                                  item.status === "NOT_FOUND";
                                const isAmbiguous =
                                  item.status === "AMBIGUOUS";
                                return (
                                  <tr
                                    key={item.id}
                                    className={`border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${
                                      isNotFound
                                        ? "text-red-500"
                                        : "text-gray-800 dark:text-gray-200"
                                    }`}
                                  >
                                    <td className="py-2 pr-4">
                                      <span className="flex items-center flex-wrap gap-1.5">
                                        {item.namaBarang}
                                        {isNotFound && (
                                          <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">
                                            Tidak Ditemukan
                                          </span>
                                        )}
                                        {isAmbiguous && (
                                          <span className="text-xs bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                                            Ambigu
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                    <td className="py-2 text-right">
                                      {item.kuantitas}
                                    </td>
                                    <td className="py-2 text-right">
                                      {formatCurrency(item.hargaSatuan)}
                                    </td>
                                    <td className="py-2 text-right font-medium">
                                      {formatCurrency(item.subtotal)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
