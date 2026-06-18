/**
 * POST /api/stt
 *
 * Accepts multipart/form-data with:
 *   - audio: Blob (WAV or WebM)
 *   - sessionId: string (optional)
 *
 * Calls transcribeAudio, maps Whisper errors to SttError codes, and returns SttResponse.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.3
 */

import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/stt";
import type { SttResponse, SttError, AppError } from "@/types/invoice";

function logError(err: AppError) {
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  let sessionId: string | undefined;

  try {
    const formData = await request.formData();

    const audioField = formData.get("audio");
    const sessionIdField = formData.get("sessionId");

    // Resolve sessionId: use provided value or generate a new UUID
    sessionId =
      typeof sessionIdField === "string" && sessionIdField.trim() !== ""
        ? sessionIdField.trim()
        : crypto.randomUUID();

    // Validate audio field
    if (!audioField || !(audioField instanceof Blob)) {
      const err: AppError = {
        code: "STT_INVALID_REQUEST",
        message: "Field 'audio' is missing or not a valid Blob.",
        stage: "stt",
        sessionId,
        timestamp: new Date().toISOString(),
      };
      logError(err);
      const body: SttError = {
        code: "STT_SERVICE_UNAVAILABLE",
        message: err.message,
      };
      return NextResponse.json(body, { status: 400 });
    }

    const audioBlob: Blob = audioField;

    // Detect MIME type; default to audio/webm if missing
    const rawType = audioBlob.type || "audio/webm";
    const mimeType: "audio/wav" | "audio/webm" = rawType.includes("wav")
      ? "audio/wav"
      : "audio/webm";

    // Convert Blob to Buffer
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());

    // Perform transcription
    const transcript = await transcribeAudio(audioBuffer, mimeType);

    // Empty transcript → STT_NO_SPEECH_DETECTED (Requirement 2.6)
    if (!transcript || transcript.trim() === "") {
      const err: AppError = {
        code: "STT_NO_SPEECH_DETECTED",
        message: "Audio diterima namun tidak mengandung ucapan yang terdeteksi.",
        stage: "stt",
        sessionId,
        timestamp: new Date().toISOString(),
      };
      logError(err);
      const body: SttError = {
        code: "STT_NO_SPEECH_DETECTED",
        message: err.message,
      };
      return NextResponse.json(body, { status: 400 });
    }

    // Success
    const response: SttResponse = {
      transcript: transcript.trim(),
      sessionId,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    // Map Whisper / OpenAI HTTP errors to SttError codes
    const sttError = mapWhisperError(error, sessionId);
    logError({
      ...sttError,
      stage: "stt",
      timestamp: new Date().toISOString(),
    });

    const body: SttError = {
      code: sttError.code as SttError["code"],
      message: sttError.message,
    };

    const httpStatus = sttError.code === "STT_AUDIO_TOO_LONG" ? 400 : 503;
    return NextResponse.json(body, { status: httpStatus });
  }
}

// ── Error mapping ─────────────────────────────────────────────────────────────

interface MappedError {
  code: string;
  message: string;
  sessionId?: string;
}

function mapWhisperError(error: unknown, sessionId?: string): MappedError {
  // OpenAI SDK wraps HTTP errors as objects with a `status` property
  if (isOpenAIError(error)) {
    const status = error.status;
    const rawMessage: string =
      typeof error.message === "string" ? error.message : "Unknown error";

    // Requirement 2.5: Audio > 120s → STT_AUDIO_TOO_LONG
    if (
      status === 400 &&
      (rawMessage.toLowerCase().includes("too long") ||
        rawMessage.toLowerCase().includes("duration") ||
        rawMessage.toLowerCase().includes("maximum"))
    ) {
      return {
        code: "STT_AUDIO_TOO_LONG",
        message:
          "Durasi audio melebihi batas maksimum 120 detik. Harap rekam ulang dengan durasi lebih pendek.",
        sessionId,
      };
    }

    // Requirement 2.4: Low quality audio → STT_LOW_QUALITY
    if (
      status === 400 &&
      (rawMessage.toLowerCase().includes("quality") ||
        rawMessage.toLowerCase().includes("noise") ||
        rawMessage.toLowerCase().includes("unrecognizable"))
    ) {
      return {
        code: "STT_LOW_QUALITY",
        message:
          "Kualitas audio di bawah ambang batas. Harap rekam ulang di lingkungan yang lebih sunyi.",
        sessionId,
      };
    }

    // Requirement 2.3: 503 / service unavailable → STT_SERVICE_UNAVAILABLE
    if (status === 503 || status === 502 || status === 500) {
      return {
        code: "STT_SERVICE_UNAVAILABLE",
        message:
          "Layanan Speech-to-Text tidak tersedia saat ini. Silakan coba beberapa saat lagi.",
        sessionId,
      };
    }

    // Other 4xx / 5xx: fall through to service unavailable
    return {
      code: "STT_SERVICE_UNAVAILABLE",
      message: `Terjadi kesalahan pada layanan Speech-to-Text: ${rawMessage}`,
      sessionId,
    };
  }

  // Network timeout (AbortError, fetch timeout, etc.) → STT_SERVICE_UNAVAILABLE
  if (isTimeoutError(error)) {
    return {
      code: "STT_SERVICE_UNAVAILABLE",
      message:
        "Permintaan ke layanan Speech-to-Text melebihi batas waktu. Silakan coba lagi.",
      sessionId,
    };
  }

  // Generic / unknown errors
  const message =
    error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
  return {
    code: "STT_SERVICE_UNAVAILABLE",
    message: `Layanan Speech-to-Text mengalami gangguan: ${message}`,
    sessionId,
  };
}

function isOpenAIError(
  error: unknown
): error is { status: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  );
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.name.toLowerCase();
  const msg = error.message.toLowerCase();
  return (
    name.includes("aborterror") ||
    name.includes("timeout") ||
    msg.includes("timeout") ||
    msg.includes("timed out")
  );
}
