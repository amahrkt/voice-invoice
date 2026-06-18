"use client";

/**
 * VoiceRecorder component — manages the full record → transcribe → parse → invoice lifecycle.
 *
 * State machine: idle → requesting_permission → recording → uploading → processing → done | error
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 10.2
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import type { AppError, InvoiceResponse, RecorderState } from "@/types/invoice";

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_RECORDING_SECONDS = 120;
const MIN_RECORDING_SECONDS = 1;
const COUNTDOWN_INTERVAL_MS = 1000; // ≤ 1 s interval for pulse/countdown (Req 1.3)

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VoiceRecorderProps {
  onInvoiceReady: (invoice: InvoiceResponse) => void;
  onError: (error: AppError) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pick the best supported MIME type for MediaRecorder (Req 1.6). */
function getBestMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/wav")) return "audio/wav";
  return ""; // let the browser decide
}

/** Build a standardised AppError. */
function makeAppError(
  code: string,
  message: string,
  stage: AppError["stage"],
  sessionId?: string
): AppError {
  return { code, message, stage, sessionId, timestamp: new Date().toISOString() };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoiceRecorder({ onInvoiceReady, onError }: VoiceRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTooShortWarning, setIsTooShortWarning] = useState(false);
  const [retainedBlob, setRetainedBlob] = useState<Blob | null>(null);
  const [retainedSessionId, setRetainedSessionId] = useState<string | null>(null);
  const [isSttUnavailable, setIsSttUnavailable] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>("");

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // ── Timer management ──────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= MAX_RECORDING_SECONDS) {
          // Auto-stop will be triggered by the effect below
        }
        return next;
      });
    }, COUNTDOWN_INTERVAL_MS);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Auto-stop at 120 s (Req 1.7) ─────────────────────────────────────────

  useEffect(() => {
    if (elapsedSeconds >= MAX_RECORDING_SECONDS && recorderState === "recording") {
      handleStopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedSeconds, recorderState]);

  // ── API call sequence ─────────────────────────────────────────────────────

  const runApiSequence = useCallback(
    async (audioBlob: Blob, sessionId: string) => {
      // ── 1. POST /api/stt ──────────────────────────────────────────────────
      setRecorderState("uploading");

      let transcript: string;
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("sessionId", sessionId);

        const sttRes = await fetch("/api/stt", { method: "POST", body: formData });

        if (!sttRes.ok) {
          const sttErr = await sttRes.json().catch(() => ({}));
          const code: string = sttErr?.code ?? "STT_SERVICE_UNAVAILABLE";

          // Req 1.8 / 10.2: On STT_SERVICE_UNAVAILABLE retain blob and show "Coba Lagi"
          if (code === "STT_SERVICE_UNAVAILABLE") {
            setRetainedBlob(audioBlob);
            setRetainedSessionId(sessionId);
            setIsSttUnavailable(true);
            setErrorMessage(
              sttErr?.message ?? "Layanan Speech-to-Text tidak tersedia. Silakan coba lagi."
            );
            setRecorderState("error");
            onError(
              makeAppError(
                code,
                sttErr?.message ?? "STT service unavailable",
                "stt",
                sessionId
              )
            );
            return;
          }

          // Other STT errors
          const msg: string =
            sttErr?.message ?? `STT gagal dengan kode: ${code}`;
          setErrorMessage(msg);
          setIsSttUnavailable(false);
          setRetainedBlob(null);
          setRecorderState("error");
          onError(makeAppError(code, msg, "stt", sessionId));
          return;
        }

        const sttData = await sttRes.json();
        transcript = sttData.transcript as string;
      } catch (networkErr) {
        const msg = "Gagal menghubungi layanan Speech-to-Text. Periksa koneksi internet Anda.";
        setRetainedBlob(audioBlob);
        setRetainedSessionId(sessionId);
        setIsSttUnavailable(true);
        setErrorMessage(msg);
        setRecorderState("error");
        onError(makeAppError("STT_SERVICE_UNAVAILABLE", msg, "network", sessionId));
        return;
      }

      // ── 2. POST /api/parse ────────────────────────────────────────────────
      setRecorderState("processing");

      let items: unknown[];
      try {
        const parseRes = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, sessionId }),
        });

        if (!parseRes.ok) {
          const parseErr = await parseRes.json().catch(() => ({}));
          const msg: string = parseErr?.error ?? "Gagal mengekstrak item dari transkripsi.";
          setErrorMessage(msg);
          setIsSttUnavailable(false);
          setRetainedBlob(null);
          setRecorderState("error");
          onError(makeAppError("PARSE_ERROR", msg, "parse", sessionId));
          return;
        }

        const parseData = await parseRes.json();
        items = parseData.items as unknown[];
      } catch {
        const msg = "Gagal menghubungi layanan parser.";
        setErrorMessage(msg);
        setIsSttUnavailable(false);
        setRetainedBlob(null);
        setRecorderState("error");
        onError(makeAppError("PARSE_ERROR", msg, "network", sessionId));
        return;
      }

      // ── 3. POST /api/invoice ──────────────────────────────────────────────
      let invoice: InvoiceResponse;
      try {
        const invoiceRes = await fetch("/api/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, sessionId, transcript }),
        });

        if (!invoiceRes.ok) {
          const invoiceErr = await invoiceRes.json().catch(() => ({}));
          const code: string = invoiceErr?.code ?? "INVOICE_ERROR";
          const msg: string = invoiceErr?.error ?? "Gagal membuat invoice.";
          setErrorMessage(msg);
          setIsSttUnavailable(false);
          setRetainedBlob(null);
          setRecorderState("error");
          onError(makeAppError(code, msg, "invoice", sessionId));
          return;
        }

        invoice = (await invoiceRes.json()) as InvoiceResponse;
      } catch {
        const msg = "Gagal menghubungi layanan invoice.";
        setErrorMessage(msg);
        setIsSttUnavailable(false);
        setRetainedBlob(null);
        setRecorderState("error");
        onError(makeAppError("INVOICE_ERROR", msg, "network", sessionId));
        return;
      }

      // ── All done ──────────────────────────────────────────────────────────
      setRecorderState("done");
      setRetainedBlob(null);
      setRetainedSessionId(null);
      setIsSttUnavailable(false);
      setErrorMessage(null);
      onInvoiceReady(invoice);
    },
    [onError, onInvoiceReady]
  );

  // ── Start recording ───────────────────────────────────────────────────────

  const handleStartRecording = useCallback(async () => {
    setIsTooShortWarning(false);
    setErrorMessage(null);
    setIsSttUnavailable(false);
    setRetainedBlob(null);
    setRetainedSessionId(null);

    // Req 1.1: request mic permission
    setRecorderState("requesting_permission");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Req 1.2: permission denied
      const msg = "Akses mikrofon ditolak. Izinkan akses mikrofon untuk menggunakan fitur ini.";
      setErrorMessage(msg);
      setRecorderState("error");
      onError(makeAppError("MIC_PERMISSION_DENIED", msg, "stt"));
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = getBestMimeType();
    const recorderOptions = mimeType ? { mimeType } : undefined;
    const mediaRecorder = new MediaRecorder(stream, recorderOptions);
    mediaRecorderRef.current = mediaRecorder;

    // Generate a new sessionId for this recording session
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    startTimeRef.current = Date.now();

    mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Stop all mic tracks
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      stopTimer();

      const durationSeconds = (Date.now() - startTimeRef.current) / 1000;

      // Req 1.5: discard if < 1 second
      if (durationSeconds < MIN_RECORDING_SECONDS) {
        setIsTooShortWarning(true);
        setRecorderState("idle");
        chunksRef.current = [];
        return;
      }

      const finalMimeType = mimeType || "audio/webm";
      const audioBlob = new Blob(chunksRef.current, { type: finalMimeType });
      chunksRef.current = [];

      await runApiSequence(audioBlob, sessionIdRef.current);
    };

    mediaRecorder.start(250); // collect data every 250 ms
    setRecorderState("recording");
    startTimer();
  }, [onError, runApiSequence, startTimer, stopTimer]);

  // ── Stop recording ────────────────────────────────────────────────────────

  const handleStopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Retry with retained blob (Req 1.8 / 10.2) ────────────────────────────

  const handleRetryWithBlob = useCallback(async () => {
    if (!retainedBlob || !retainedSessionId) return;
    setIsSttUnavailable(false);
    setErrorMessage(null);
    await runApiSequence(retainedBlob, retainedSessionId);
  }, [retainedBlob, retainedSessionId, runApiSequence]);

  // ── Reset to idle ─────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setRecorderState("idle");
    setErrorMessage(null);
    setIsSttUnavailable(false);
    setRetainedBlob(null);
    setRetainedSessionId(null);
    setIsTooShortWarning(false);
    setElapsedSeconds(0);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const countdown = MAX_RECORDING_SECONDS - elapsedSeconds;
  const isLoading =
    recorderState === "uploading" || recorderState === "processing";
  const isRecording = recorderState === "recording";
  const isRequestingPermission = recorderState === "requesting_permission";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-gray-200 bg-white shadow-sm w-full max-w-sm mx-auto">

      {/* ── Status indicator ── */}
      <div className="flex flex-col items-center gap-2">
        {isRecording && (
          <div className="flex items-center gap-2">
            {/* Req 1.3: pulsing red dot, ≤ 1 s interval */}
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            <span className="text-sm font-medium text-red-600">Sedang Merekam…</span>
          </div>
        )}

        {isRecording && (
          /* Countdown timer (Req 1.7) */
          <p className="text-xs text-gray-500">
            Sisa waktu: <span className="font-semibold text-gray-700">{countdown}</span> detik
          </p>
        )}

        {isRequestingPermission && (
          <p className="text-sm text-gray-500">Meminta izin mikrofon…</p>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="text-sm font-medium">
              {recorderState === "uploading" ? "Mengunggah audio…" : "Memproses transkripsi…"}
            </span>
          </div>
        )}

        {recorderState === "done" && (
          <p className="text-sm font-medium text-green-600">Invoice berhasil dibuat!</p>
        )}
      </div>

      {/* ── Main action button ── */}
      <div className="flex gap-3">
        {/* idle / done / error (non-STT-unavailable) → "Mulai Rekam" */}
        {(recorderState === "idle" ||
          recorderState === "done" ||
          (recorderState === "error" && !isSttUnavailable)) && (
          <button
            type="button"
            onClick={
              recorderState === "error" && !isSttUnavailable
                ? handleReset
                : handleStartRecording
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            aria-label="Mulai rekam suara"
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
            {recorderState === "error" ? "Rekam Ulang" : "Mulai Rekam"}
          </button>
        )}

        {/* recording → "Berhenti" */}
        {isRecording && (
          <button
            type="button"
            onClick={handleStopRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 active:scale-95 transition-all"
            aria-label="Hentikan rekaman"
          >
            <Square className="w-4 h-4 fill-current" aria-hidden="true" />
            Berhenti
          </button>
        )}

        {/* requesting_permission / loading → disabled indicator */}
        {(isRequestingPermission || isLoading) && (
          <button
            type="button"
            disabled
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-300 text-gray-500 font-medium text-sm cursor-not-allowed"
            aria-disabled="true"
          >
            <MicOff className="w-4 h-4" aria-hidden="true" />
            Tunggu…
          </button>
        )}
      </div>

      {/* ── "Coba Lagi" button for STT_SERVICE_UNAVAILABLE (Req 1.8 / 10.2) ── */}
      {recorderState === "error" && isSttUnavailable && retainedBlob && (
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            type="button"
            onClick={handleRetryWithBlob}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 active:scale-95 transition-all"
            aria-label="Coba lagi dengan rekaman yang sama"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Coba Lagi
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-400 underline hover:text-gray-600"
            aria-label="Rekam ulang dari awal"
          >
            Rekam ulang dari awal
          </button>
        </div>
      )}

      {/* ── Warnings & errors ── */}
      {/* Req 1.5: recording too short */}
      {isTooShortWarning && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-full text-center"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Rekaman terlalu singkat. Silakan rekam lebih dari 1 detik.
        </p>
      )}

      {/* General error message */}
      {recorderState === "error" && errorMessage && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
