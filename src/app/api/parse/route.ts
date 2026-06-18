/**
 * POST /api/parse
 *
 * Accepts a JSON body with { transcript, sessionId }, calls the AI parser to
 * extract structured item/quantity pairs, and returns a ParseResponse.
 *
 * Requirements: 3.1, 3.5, 10.3
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseTranscript } from "@/lib/parser";
import type { ParseRequest, ParseResponse, AppError } from "@/types/invoice";

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

const ParseRequestSchema = z.object({
  transcript: z.string().min(1, "transcript must be a non-empty string"),
  sessionId: z.string(),
});

// ── Output validation schema ──────────────────────────────────────────────────

const ParsedItemSchema = z.object({
  namaBarang: z.string().min(1),
  kuantitas: z.number().int().min(1),
});

const ParseResponseSchema = z.object({
  items: z.array(ParsedItemSchema),
  status: z.enum(["OK", "PARSER_NO_ITEMS_DETECTED"]),
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
        code: "PARSE_INVALID_REQUEST",
        message: "Request body must be valid JSON.",
        stage: "parse",
        timestamp: new Date().toISOString(),
      };
      logError(err);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Validate input
    const inputResult = ParseRequestSchema.safeParse(body);
    if (!inputResult.success) {
      const message = inputResult.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      const err: AppError = {
        code: "PARSE_INVALID_REQUEST",
        message,
        stage: "parse",
        timestamp: new Date().toISOString(),
      };
      logError(err);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { transcript, sessionId: sid } = inputResult.data as ParseRequest;
    sessionId = sid;

    // Call the AI parser
    const parsedItems = await parseTranscript(transcript);

    // Determine status based on whether any items were detected (Requirement 3.5)
    const status: ParseResponse["status"] =
      parsedItems.length === 0 ? "PARSER_NO_ITEMS_DETECTED" : "OK";

    const responseBody: ParseResponse = {
      items: parsedItems,
      status,
    };

    // Validate output with Zod before returning (Requirement 10.3)
    const outputResult = ParseResponseSchema.safeParse(responseBody);
    if (!outputResult.success) {
      const message = `Output validation failed: ${outputResult.error.message}`;
      const err: AppError = {
        code: "PARSE_OUTPUT_INVALID",
        message,
        stage: "parse",
        sessionId,
        timestamp: new Date().toISOString(),
      };
      logError(err);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json(outputResult.data, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    const err: AppError = {
      code: "PARSE_INTERNAL_ERROR",
      message,
      stage: "parse",
      sessionId,
      timestamp: new Date().toISOString(),
    };
    logError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
