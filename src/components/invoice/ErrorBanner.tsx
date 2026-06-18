"use client";

/**
 * ErrorBanner component — renders an AppError with a human-readable Indonesian message.
 *
 * - Shows "Coba Rekam Lagi" CTA on STT_SERVICE_UNAVAILABLE (Req 10.2)
 * - Shows "Data sesi masih tersimpan." note on DB_CONNECTION_ERROR (Req 10.1)
 * - Uses role="alert" for accessibility
 * - Red background for hard errors; amber background for warnings/soft errors
 *
 * Requirements: 10.1, 10.2
 */

import { AlertTriangle, X, RefreshCw } from "lucide-react";
import type { AppError } from "@/types/invoice";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ErrorBannerProps {
  error: AppError;
  onRetry?: () => void;    // called when "Coba Rekam Lagi" is clicked
  onDismiss?: () => void;  // called when dismiss button is clicked
}

// ── Error message map ─────────────────────────────────────────────────────────

/**
 * Maps each error code to a human-readable Indonesian message.
 * Falls back to `error.message` if code is not in the map.
 */
const ERROR_MESSAGES: Record<string, string> = {
  MIC_PERMISSION_DENIED:
    "Akses mikrofon ditolak. Izinkan akses mikrofon di pengaturan browser untuk menggunakan fitur ini.",
  RECORDING_TOO_SHORT:
    "Rekaman terlalu singkat. Silakan rekam lebih dari 1 detik.",
  STT_SERVICE_UNAVAILABLE:
    "Layanan Speech-to-Text tidak tersedia. Silakan coba lagi.",
  STT_LOW_QUALITY:
    "Kualitas audio terlalu rendah. Coba rekam ulang di lingkungan yang lebih sunyi.",
  STT_AUDIO_TOO_LONG:
    "Durasi rekaman melebihi batas 120 detik. Silakan rekam dengan durasi lebih pendek.",
  STT_NO_SPEECH_DETECTED:
    "Tidak ada ucapan yang terdeteksi dalam rekaman. Pastikan mikrofon aktif dan Anda berbicara dengan jelas.",
  PARSER_NO_ITEMS_DETECTED:
    "Sistem tidak dapat mendeteksi barang dari transkripsi. Coba sebutkan nama barang dan jumlahnya dengan lebih jelas.",
  DB_CONNECTION_ERROR:
    "Gagal terhubung ke database. Periksa koneksi server dan coba lagi.",
  INVOICE_SAVE_FAILED:
    "Gagal menyimpan invoice. Silakan coba lagi atau hubungi administrator.",
};

/**
 * Error codes that should use amber (warning) styling instead of red (error) styling.
 * These indicate recoverable or informational conditions rather than hard failures.
 */
const WARNING_CODES = new Set<string>([
  "RECORDING_TOO_SHORT",
  "STT_LOW_QUALITY",
  "STT_NO_SPEECH_DETECTED",
  "PARSER_NO_ITEMS_DETECTED",
]);

// ── Component ─────────────────────────────────────────────────────────────────

export default function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  const isWarning = WARNING_CODES.has(error.code);
  const humanMessage = ERROR_MESSAGES[error.code] ?? error.message;

  const isRetryable = error.code === "STT_SERVICE_UNAVAILABLE";
  const isDbError = error.code === "DB_CONNECTION_ERROR";

  // ── Colour tokens ─────────────────────────────────────────────────────────
  const containerClass = isWarning
    ? "bg-amber-50 border border-amber-200 text-amber-800"
    : "bg-red-50 border border-red-200 text-red-800";

  const iconClass = isWarning ? "text-amber-500" : "text-red-500";

  const retryButtonClass =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 active:scale-95 transition-all";

  const dismissButtonClass = isWarning
    ? "p-1 rounded hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors"
    : "p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex flex-col gap-2 rounded-xl px-4 py-3 w-full ${containerClass}`}
    >
      {/* ── Top row: icon + message + dismiss ── */}
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClass}`}
          aria-hidden="true"
        />

        <p className="flex-1 text-sm leading-snug">{humanMessage}</p>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={dismissButtonClass}
            aria-label="Tutup pesan kesalahan"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── Req 10.2: "Coba Rekam Lagi" CTA on STT_SERVICE_UNAVAILABLE ── */}
      {isRetryable && onRetry && (
        <div className="pl-7">
          <button
            type="button"
            onClick={onRetry}
            className={retryButtonClass}
            aria-label="Coba rekam lagi"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Coba Rekam Lagi
          </button>
        </div>
      )}

      {/* ── Req 10.1: session-preserved note on DB_CONNECTION_ERROR ── */}
      {isDbError && (
        <p className="pl-7 text-xs font-medium text-red-700">
          Data sesi masih tersimpan.
        </p>
      )}
    </div>
  );
}
