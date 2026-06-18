/**
 * AI Parser layer using GPT-4o-mini to extract item/quantity pairs from
 * Indonesian cashier transcription text.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import OpenAI from "openai";
import { z } from "zod";
import type { ParsedItem } from "@/types/invoice";

const openai = new OpenAI(); // reads OPENAI_API_KEY from env automatically

/**
 * Exact system prompt as specified in the design document.
 * Instructs the model to:
 * - Extract all item/quantity pairs from Indonesian transcription text
 * - Map "selusin"/"lusin" → 12
 * - Map cardinal words (satu=1, dua=2, … sepuluh=10, etc.) → integers
 * - Default quantity to 1 when not mentioned
 * - Return a JSON array, max 50 unique items
 * - Return [] when no items are detected
 */
const SYSTEM_PROMPT = `
Kamu adalah parser kasir. Dari teks transkripsi bahasa Indonesia berikut,
ekstrak semua pasangan nama barang dan kuantitas.
Kembalikan HANYA JSON array dengan format:
[{"namaBarang": "...", "kuantitas": <integer>=1}, ...]
Aturan:
- Jika kuantitas tidak disebutkan, gunakan 1
- "selusin" atau "lusin" = 12
- Kenali angka digit maupun kata bilangan (satu=1, dua=2, ..., sepuluh=10, dll)
- Maks 50 item unik
- Jika tidak ada item terdeteksi, kembalikan []
`.trim();

/**
 * Zod schema for validating the GPT response.
 * Each element must have a non-empty namaBarang string and an integer kuantitas >= 1.
 */
const ParsedItemSchema = z.object({
  namaBarang: z.string().min(1, "namaBarang must be a non-empty string"),
  kuantitas: z
    .number()
    .int("kuantitas must be an integer")
    .min(1, "kuantitas must be >= 1"),
});

const ParsedItemArraySchema = z.array(ParsedItemSchema).max(50);

/**
 * Calls GPT-4o-mini to extract structured item/quantity pairs from a
 * raw Indonesian transcription string.
 *
 * - Uses JSON mode to guarantee a JSON response from the model.
 * - Validates the response with Zod before returning.
 * - Returns an empty array when no items are detected (valid use-case).
 *
 * @param transcript - Raw transcription text from Whisper STT
 * @returns Array of ParsedItem objects ({ namaBarang, kuantitas })
 * @throws If the model returns malformed JSON or the Zod schema validation fails
 */
export async function parseTranscript(transcript: string): Promise<ParsedItem[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
    temperature: 0,
  });

  const rawContent = response.choices[0]?.message?.content ?? "[]";

  // The model returns a JSON object when using json_object mode.
  // The system prompt instructs it to put the array directly, but json_object
  // mode wraps it in an object. We handle both cases:
  // 1) Model returns { "items": [...] } or any single-key wrapper
  // 2) Model returns the array directly as a top-level value (shouldn't happen
  //    with json_object mode, but we guard against it anyway)
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(`AI_Parser: invalid JSON received from GPT — ${rawContent}`);
  }

  // Unwrap if the model wrapped the array in an object
  let candidates: unknown = parsed;
  if (!Array.isArray(parsed) && typeof parsed === "object" && parsed !== null) {
    const values = Object.values(parsed as Record<string, unknown>);
    if (values.length === 1 && Array.isArray(values[0])) {
      candidates = values[0];
    } else {
      // Try to find any array-valued key as a fallback
      const arrayValue = values.find((v) => Array.isArray(v));
      if (arrayValue !== undefined) {
        candidates = arrayValue;
      }
    }
  }

  // Validate with Zod
  const validationResult = ParsedItemArraySchema.safeParse(candidates);
  if (!validationResult.success) {
    throw new Error(
      `AI_Parser: Zod validation failed — ${validationResult.error.message}`
    );
  }

  return validationResult.data;
}
