# Implementation Plan: Voice-to-Invoice

## Overview

Implement the Voice-to-Invoice feature incrementally, starting with test infrastructure and the data layer
(Prisma schema + DB utilities), then the server-side processing pipeline (STT → Parser → Invoice Engine),
then the API route handlers, and finally the frontend components. Property-based tests are co-located with
each module they validate.

## Tasks

- [~] 1. Install dependencies and configure test infrastructure
  - Run: `npm install openai`
  - Run: `npm install --save-dev fast-check vitest @vitejs/plugin-react @vitest/coverage-v8`
  - Create `vitest.config.ts` at the project root configured for Next.js/React (jsdom environment,
    path aliases matching `tsconfig.json`)
  - Add `"test": "vitest --run"` and `"test:watch": "vitest"` scripts to `package.json`
  - _Requirements: 2.1_

- [~] 2. Extend Prisma schema and generate client
  - Ensure `DATABASE_URL` is set in `.env` before running migrations (required for `pg_trgm`)
  - Add `Product`, `Invoice`, `InvoiceItem`, `InvoiceCounter` models and `ItemStatus` enum to
    `prisma/schema.prisma` exactly as specified in the design
  - Create the initial migration with `npx prisma migrate dev --name add-voice-invoice-models`
  - Add a raw SQL migration step that enables the `pg_trgm` extension:
    `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
  - Create the trigram GIN index on `Product.namaNormal`:
    `CREATE INDEX idx_product_trgm ON "Product" USING gin("namaNormal" gin_trgm_ops);`
  - Run `npx prisma generate` to regenerate the Prisma client after migration
  - _Requirements: 4.1, 4.2, 5.3, 5.4_

- [x] 3. Set up shared infrastructure and types
  - [x] 3.1 Create `src/lib/prisma.ts` — Prisma singleton client
    - Export a single `PrismaClient` instance (reuse across hot reloads in dev via `globalThis`)
    - _Requirements: 5.4_

  - [x] 3.2 Create `src/types/invoice.ts` — all shared TypeScript interfaces
    - Define `ParsedItem`, `ItemLine`, `ProductCandidate`, `InvoiceRequest`, `InvoiceResponse`,
      `PickListItem`, `PackingListItem`, `SttResponse`, `SttError`, `ParseRequest`, `ParseResponse`,
      `AppError`, and `RecorderState` exactly as specified in the design
    - _Requirements: 3.4, 4.3, 5.3_

- [ ] 4. Implement core library modules
  - [-] 4.1 Create `src/lib/invoiceNumber.ts` — daily invoice number generator
    - Implement `generateInvoiceNumber(prisma, txDate: Date): Promise<string>` that atomically
      upserts `InvoiceCounter` and returns `INV-YYYYMMDD-XXXX` (WIB timezone, zero-padded to 4 digits)
    - _Requirements: 5.6_

  - [ ]* 4.2 Write property test for invoice number format (Property 4)
    - **Property 4: Invoice Number Format and Daily Uniqueness**
    - **Validates: Requirements 5.6**
    - File: `src/__tests__/lib/invoiceNumber.test.ts`

  - [-] 4.3 Create `src/lib/formatCurrency.ts` — Rupiah formatter
    - Implement `formatCurrency(n: number): string` → `"Rp X.XXX"` (dot thousands, no decimals)
    - _Requirements: 6.6_

  - [ ]* 4.4 Write property test for currency formatter (Property 5)
    - **Property 5: Currency Formatter Round-Trip**
    - **Validates: Requirements 6.6**
    - File: `src/__tests__/lib/formatCurrency.test.ts`

  - [-] 4.5 Create `src/lib/fuzzyMatch.ts` — trigram + Levenshtein fuzzy matcher
    - Implement `normalize(s: string): string` (lowercase, trim, collapse whitespace)
    - Implement `fuzzySearch(query: string, prisma: PrismaClient): Promise<ProductCandidate[]>`
      executing the parameterized trigram SQL from the design, re-ranking with Levenshtein distance,
      and capping results at 5 candidates
    - _Requirements: 4.2, 4.3_

  - [ ]* 4.6 Write property tests for fuzzy match (Properties 6 and 7)
    - **Property 6: Fuzzy Match Candidate Count Bound**
    - **Property 7: Fuzzy Match Correctness for Near-Typos**
    - **Validates: Requirements 4.2, 4.3**
    - File: `src/__tests__/lib/fuzzyMatch.test.ts`

  - [x] 4.7 Create `src/lib/invoiceEngine.ts` — invoice computation module
    - Implement `recalculate(invoice: InvoiceResponse): InvoiceResponse` — pure function that
      recomputes subtotals (`hargaSatuan × kuantitas`) and `totalKeseluruhan` (sum of non-NOT_FOUND
      subtotals) with integer arithmetic
    - Implement `buildPickList(items: ItemLine[]): PickListItem[]` — filters out NOT_FOUND items,
      sorts alphabetically by `namaBarang` (locale `id-ID`)
    - Implement `buildPackingList(pickList: PickListItem[]): PackingListItem[]` — mirrors pick list
      with `packed: false`
    - Implement `buildInvoiceResponse(...)` — assembles full `InvoiceResponse` from engine outputs
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 7.1, 7.2, 8.1_

  - [ ]* 4.8 Write property tests for invoice engine (Properties 1, 2, 3, 10, 11, 12)
    - **Property 1: Subtotal Arithmetic Correctness**
    - **Property 2: Total Equals Sum of Non-NOT_FOUND Subtotals**
    - **Property 3: NOT_FOUND Items Do Not Block Invoice Generation**
    - **Property 10: Pick List Contains Only Found Items**
    - **Property 11: Pick List Is Alphabetically Sorted**
    - **Property 12: Packing List Mirrors Pick List Content With Unchecked State**
    - **Validates: Requirements 5.1, 5.2, 5.5, 7.1, 7.2, 8.1**
    - File: `src/__tests__/lib/invoiceEngine.test.ts`

  - [ ]* 4.9 Write property test for inline edit recalculation (Property 13)
    - **Property 13: Inline Edit Recalculation Correctness**
    - **Validates: Requirements 10.5**
    - File: `src/__tests__/lib/invoiceEngine.test.ts`

- [~] 5. Checkpoint — Ensure all lib tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement AI and STT library wrappers
  - [x] 6.1 Create `src/lib/stt.ts` — Whisper API wrapper
    - Implement `transcribeAudio(audioBuffer: Buffer, mimeType: "audio/wav" | "audio/webm"): Promise<string>`
      using the `openai` SDK (`whisper-1`, `language: "id"`, `response_format: "text"`)
    - Add `OPENAI_API_KEY` to `.env` (the `OpenAI` constructor reads it automatically)
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Create `src/lib/parser.ts` — GPT-4o-mini item extractor
    - Implement `parseTranscript(transcript: string): Promise<ParsedItem[]>`
    - Use the exact system prompt from the design (`SYSTEM_PROMPT` constant); validate the JSON
      response with Zod before returning
    - Map "selusin"/"lusin" → 12, cardinal words → integers; default quantity 1 for unlabelled items
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 6.3 Write property tests for parser output schema (Properties 8 and 9)
    - **Property 8: Parser Output Schema Invariant**
    - **Property 9: Default Quantity for Items Without Explicit Count**
    - **Validates: Requirements 3.4, 3.3**
    - File: `src/__tests__/lib/parser.test.ts`

- [x] 7. Implement API route handlers
  - [x] 7.1 Create `src/app/api/stt/route.ts`
    - Accept `multipart/form-data` with `audio` field and optional `sessionId`
    - Call `transcribeAudio`, map Whisper HTTP errors to `SttError` codes
      (`STT_SERVICE_UNAVAILABLE`, `STT_LOW_QUALITY`, `STT_AUDIO_TOO_LONG`, `STT_NO_SPEECH_DETECTED`)
    - Return `SttResponse` on success; log errors via `logError()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 10.3_

  - [ ]* 7.2 Write unit tests for STT route handler
    - Mock the `openai` client; verify correct `SttError` codes for each failure mode
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
    - File: `src/__tests__/api/stt.test.ts`

  - [x] 7.3 Create `src/app/api/parse/route.ts`
    - Accept `ParseRequest`; call `parseTranscript`; return `ParseResponse`
    - Return `PARSER_NO_ITEMS_DETECTED` status when result is an empty array
    - Validate output with Zod before returning; log errors via `logError()`
    - _Requirements: 3.1, 3.5, 10.3_

  - [ ]* 7.4 Write unit tests for parse route handler
    - Mock the OpenAI chat completions; verify Zod rejects malformed JSON
    - _Requirements: 3.4, 3.5_
    - File: `src/__tests__/api/parse.test.ts`

  - [x] 7.5 Create `src/app/api/invoice/route.ts`
    - Accept `InvoiceRequest`; call `fuzzySearch` for each item in a batch
    - Build `ItemLine[]` with statuses `OK`, `AMBIGUOUS`, or `NOT_FOUND`
    - Call `generateInvoiceNumber`, `buildPickList`, `buildPackingList`, `buildInvoiceResponse`
    - Persist `Invoice` + `InvoiceItem[]` atomically via a Prisma interactive transaction
    - Return complete `InvoiceResponse`; log errors via `logError()`
    - _Requirements: 4.1, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.1, 7.2, 8.1, 10.1, 10.3_

  - [ ]* 7.6 Write unit tests for invoice route handler
    - Mock Prisma; verify the atomic transaction is used and verify error codes on failure
    - _Requirements: 5.4, 10.1_
    - File: `src/__tests__/api/invoice.test.ts`

  - [x] 7.7 Create `src/app/api/products/route.ts`
    - Accept `GET /api/products?q=<term>`; call `fuzzySearch`; return up to 10 candidates
    - _Requirements: 4.3_

- [~] 8. Checkpoint — Ensure all API and lib tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement frontend components
  - [x] 9.1 Create `src/components/invoice/VoiceRecorder.tsx`
    - Implement the state machine: `idle → requesting_permission → recording → uploading →
      processing → done | error`
    - Call `/api/stt` with multipart form data, then `/api/parse`, then `/api/invoice` in sequence
    - Display pulsing red indicator while recording (≤1 s interval)
    - Auto-stop at 120 s with a visible countdown timer
    - On `STT_SERVICE_UNAVAILABLE`: retain audio blob in state and show "Coba Lagi" button
    - On recording < 1 s: discard and show "Rekaman terlalu singkat" warning
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 10.2_

  - [ ]* 9.2 Write unit tests for VoiceRecorder
    - Mock `navigator.mediaDevices.getUserMedia`; test: permission denied, recording too short,
      auto-stop at 120 s, retry on STT error (audio retained)
    - _Requirements: 1.2, 1.5, 1.7, 1.8_
    - File: `src/__tests__/components/VoiceRecorder.test.tsx`

  - [x] 9.3 Create `src/components/invoice/InvoiceTable.tsx`
    - Render three tabs: "Invoice", "Pick List", "Packing List"
    - Invoice tab: header with `nomorInvoice`, date/time; table with columns No, Nama Produk,
      Kuantitas, Harga Satuan, Subtotal; total row; transcript panel above table
    - Render `NOT_FOUND` rows with `text-red-600` and ⚠ icon (use `lucide-react` icons where suitable)
    - Format all prices with `formatCurrency`
    - Pick List tab: header with `nomorInvoice`; alphabetically-sorted item list
    - Packing List tab: header with `nomorInvoice` and `tanggalWaktu`; item list with unchecked
      checkboxes
    - "Edit" button on each row; on save, call `recalculate()` and update local state (no network call)
    - Loading skeleton/spinner when `invoice` is null
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.3, 7.4, 8.2, 8.3, 8.4, 10.4, 10.5_

  - [ ]* 9.4 Write unit tests for InvoiceTable
    - Snapshot test for NOT_FOUND row styling; verify currency formatting; verify tab switching
    - _Requirements: 6.4, 6.6_
    - File: `src/__tests__/components/InvoiceTable.test.tsx`

  - [x] 9.5 Create `src/components/invoice/PrintHandler.tsx`
    - Implement `printStruk()` — sets `data-print-mode="struk"` on body, calls `window.print()`,
      then removes the attribute
    - Implement `printFull()` — sets `data-print-mode="full"` on body, calls `window.print()`,
      then removes the attribute
    - Render two hidden print-only layouts (struk 80mm and full invoice) visible only under
      `@media print` using the `data-print-mode` attribute selector
    - Add `no-print` class to non-print UI elements; add the required print CSS to `globals.css`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 9.6 Create `src/components/invoice/ErrorBanner.tsx`
    - Render `AppError` with a human-readable message based on `code` and `stage`
    - Show "Coba Rekam Lagi" CTA on `STT_SERVICE_UNAVAILABLE`; show "Data sesi masih tersimpan"
      note on `DB_CONNECTION_ERROR`
    - _Requirements: 10.1, 10.2_

- [ ] 10. Assemble the invoice page
  - [ ] 10.1 Create `src/app/invoice/page.tsx` — `InvoicePage`
    - Compose `VoiceRecorder`, `InvoiceTable`, `ErrorBanner`, `PrintHandler`
    - Hold `InvoiceSession` state: `{ transcript, parsedItems, invoice, sessionId, error }`
    - Pass `onInvoiceReady` callback to `VoiceRecorder`; pass `onEditLine`/`onDeleteLine` to
      `InvoiceTable`
    - Apply `recalculate()` synchronously whenever a line is edited
    - Never clear session state on error — only reset on explicit "Transaksi Baru" click
    - _Requirements: 6.1, 6.7, 10.1, 10.2, 10.5_

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property-based tests use `fast-check` with ≥100 iterations per property (the default)
- Unit tests use `Vitest`; run with `npm test` (single pass) or `npm run test:watch`
- Task 1 (test infra) must be completed before any `*` sub-tasks that write property tests
- Task 2 (schema migration) requires `DATABASE_URL` in `.env` pointing to a running PostgreSQL instance
- All price arithmetic uses integer Rupiah values — no floating-point at any layer
- `lucide-react` is already installed; use it for icons in `InvoiceTable` and `VoiceRecorder`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["3.1", "3.2"] },
    { "id": 1, "tasks": ["4.1", "4.3", "4.5", "4.7"] },
    { "id": 2, "tasks": ["4.2", "4.4", "4.6", "4.8", "4.9", "6.1", "6.2"] },
    { "id": 3, "tasks": ["6.3", "7.1", "7.3", "7.5", "7.7"] },
    { "id": 4, "tasks": ["7.2", "7.4", "7.6"] },
    { "id": 5, "tasks": ["9.1", "9.3", "9.5", "9.6"] },
    { "id": 6, "tasks": ["9.2", "9.4"] },
    { "id": 7, "tasks": ["10.1"] }
  ]
}
```
