"use client";

/**
 * InvoicePage — main page for the Voice-to-Invoice feature.
 *
 * Composes VoiceRecorder, InvoiceTable, ErrorBanner, and PrintHandler.
 * Holds InvoiceSession state and orchestrates callbacks between components.
 *
 * Requirements: 6.1, 6.7, 10.1, 10.2, 10.5
 */

import { useState, useCallback } from "react";
import VoiceRecorder from "@/components/invoice/VoiceRecorder";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import ErrorBanner from "@/components/invoice/ErrorBanner";
import PrintHandler from "@/components/invoice/PrintHandler";
import { recalculate } from "@/lib/invoiceEngine";
import type { AppError, InvoiceResponse, ItemLine } from "@/types/invoice";

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_NAME = "Record nama barang yang ingin ada pesan";

// ── Session state ─────────────────────────────────────────────────────────────

interface InvoiceSession {
  transcript: string;
  invoice: InvoiceResponse | null;
  sessionId: string;
  error: AppError | null;
}

const INITIAL_SESSION: InvoiceSession = {
  transcript: "",
  invoice: null,
  sessionId: "",
  error: null,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvoicePage() {
  const [session, setSession] = useState<InvoiceSession>(INITIAL_SESSION);

  // ── onInvoiceReady — called by VoiceRecorder when invoice is ready ────────

  const handleInvoiceReady = useCallback((invoice: InvoiceResponse) => {
    setSession((prev) => ({
      ...prev,
      invoice,
      transcript: invoice.transcript,
      sessionId: invoice.nomorInvoice,
      error: null,
    }));
  }, []);

  // ── onError — store error WITHOUT clearing other session fields ───────────

  const handleError = useCallback((error: AppError) => {
    setSession((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  // ── onDismissError — clear the error banner ───────────────────────────────

  const handleDismissError = useCallback(() => {
    setSession((prev) => ({ ...prev, error: null }));
  }, []);

  // ── onEditLine — update itemLines[index], then recalculate synchronously ──

  const handleEditLine = useCallback(
    (index: number, updated: Partial<ItemLine>) => {
      setSession((prev) => {
        if (!prev.invoice) return prev;

        const updatedLines = prev.invoice.itemLines.map((line, i) =>
          i === index ? { ...line, ...updated } : line
        );

        const updatedInvoice = recalculate({
          ...prev.invoice,
          itemLines: updatedLines,
        });

        return { ...prev, invoice: updatedInvoice };
      });
    },
    []
  );

  // ── onDeleteLine — remove item at index, then recalculate ─────────────────

  const handleDeleteLine = useCallback((index: number) => {
    setSession((prev) => {
      if (!prev.invoice) return prev;

      const updatedLines = prev.invoice.itemLines.filter((_, i) => i !== index);

      const updatedInvoice = recalculate({
        ...prev.invoice,
        itemLines: updatedLines,
      });

      return { ...prev, invoice: updatedInvoice };
    });
  }, []);

  // ── Transaksi Baru — reset ALL session state ──────────────────────────────

  const handleNewTransaction = useCallback(() => {
    setSession(INITIAL_SESSION);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const { invoice, transcript, error } = session;
  const hasInvoice = invoice !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6">

        {/* ── Page header ── */}
        <div className="no-print">
          <h1 className="text-2xl font-bold text-gray-900">Voice to Invoice</h1>
          <p className="mt-1 text-sm text-gray-500">{STORE_NAME}</p>
        </div>

        {/* ── VoiceRecorder — always visible ── */}
        <section className="no-print">
          <VoiceRecorder
            onInvoiceReady={handleInvoiceReady}
            onError={handleError}
          />
        </section>

        {/* ── ErrorBanner — only shown when error !== null ── */}
        {error !== null && (
          <div className="no-print">
            <ErrorBanner
              error={error}
              onDismiss={handleDismissError}
            />
          </div>
        )}

        {/* ── InvoiceTable — always rendered; null invoice shows skeleton (Req 6.7) ── */}
        <InvoiceTable
          invoice={invoice}
          transcript={transcript}
          onEditLine={handleEditLine}
          onDeleteLine={handleDeleteLine}
        />

        {/* ── PrintHandler — shown only when invoice is not null ── */}
        {hasInvoice && (
          <PrintHandler invoice={invoice!} storeName={STORE_NAME} />
        )}

        {/* ── Transaksi Baru button — shown when invoice is not null ── */}
        {hasInvoice && (
          <div className="no-print flex justify-start">
            <button
              type="button"
              onClick={handleNewTransaction}
              className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all shadow-sm"
              aria-label="Mulai transaksi baru dan reset semua data sesi"
            >
              Transaksi Baru
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
