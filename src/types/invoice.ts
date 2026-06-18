/**
 * Shared TypeScript interfaces for the Voice-to-Invoice feature.
 * Requirements: 3.4, 4.3, 5.3
 */

// ── AI Parser ────────────────────────────────────────────────────────────────

export interface ParsedItem {
  namaBarang: string;
  kuantitas: number; // integer >= 1
}

// ── Invoice Engine ────────────────────────────────────────────────────────────

export interface ProductCandidate {
  id: string;
  nama: string;
  harga: number;
  score: number;
}

export interface ItemLine {
  namaBarang: string;
  kuantitas: number;
  hargaSatuan: number; // integer, in Rupiah
  subtotal: number;    // integer
  status: "OK" | "NOT_FOUND" | "AMBIGUOUS";
  candidates?: ProductCandidate[]; // max 5, when AMBIGUOUS
}

export interface PickListItem {
  namaBarang: string;
  kuantitas: number;
}

export interface PackingListItem {
  namaBarang: string;
  kuantitas: number;
  packed: boolean; // always false on creation
}

export interface InvoiceResponse {
  nomorInvoice: string;
  tanggalWaktu: string; // ISO 8601
  transcript: string;
  itemLines: ItemLine[];
  totalKeseluruhan: number;
  pickList: PickListItem[];
  packingList: PackingListItem[];
}

// ── API Request / Response types ──────────────────────────────────────────────

export interface InvoiceRequest {
  items: ParsedItem[];
  sessionId: string;
}

export interface ParseRequest {
  transcript: string;
  sessionId: string;
}

export interface ParseResponse {
  items: ParsedItem[];
  status: "OK" | "PARSER_NO_ITEMS_DETECTED";
}

// ── STT Route ─────────────────────────────────────────────────────────────────

export interface SttResponse {
  transcript: string;
  sessionId: string;
}

export interface SttError {
  code:
    | "STT_SERVICE_UNAVAILABLE"
    | "STT_LOW_QUALITY"
    | "STT_AUDIO_TOO_LONG"
    | "STT_NO_SPEECH_DETECTED";
  message: string;
}

// ── Shared Error Type ─────────────────────────────────────────────────────────

export interface AppError {
  code: string;
  message: string;
  stage: "stt" | "parse" | "invoice" | "db" | "network";
  sessionId?: string;
  timestamp: string; // ISO 8601
}

// ── Frontend Component Types ──────────────────────────────────────────────────

export type RecorderState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "uploading"
  | "processing"
  | "done"
  | "error";
