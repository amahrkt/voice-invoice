/**
 * Daily invoice number generator.
 *
 * Generates a unique invoice number per day in WIB (UTC+7) timezone using an
 * atomic upsert on the `InvoiceCounter` table. The returned format is:
 *   INV-YYYYMMDD-XXXX
 * where XXXX is a zero-padded 4-digit daily sequence number (starting at 0001).
 *
 * Requirements: 5.6
 */

/** WIB offset from UTC in milliseconds (UTC+7). */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Converts a UTC Date to a "YYYYMMDD" string in WIB (UTC+7) timezone.
 *
 * @param date - The UTC Date to convert.
 * @returns An 8-character string like "20250116".
 */
export function toWibDateString(date: Date): string {
  const wibTime = new Date(date.getTime() + WIB_OFFSET_MS);
  const year = wibTime.getUTCFullYear();
  const month = String(wibTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wibTime.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Minimal duck-typed interface for the Prisma client portion needed by
 * `generateInvoiceNumber`. This avoids a hard dependency on the generated
 * Prisma client before the schema migration that adds `InvoiceCounter` is run.
 *
 * The full `PrismaClient` (after migration) satisfies this interface.
 */
export interface PrismaWithInvoiceCounter {
  invoiceCounter: {
    upsert(args: {
      where: { date: string };
      create: { date: string; counter: number };
      update: { counter: { increment: number } };
    }): Promise<{ date: string; counter: number }>;
  };
}

/**
 * Atomically increments the daily invoice counter and returns a formatted
 * invoice number.
 *
 * This function must be called **inside** a Prisma interactive transaction so
 * that the upsert and the invoice insert are committed atomically. Passing the
 * transaction client (`tx`) as `prisma` ensures that the counter increment and
 * the invoice row are part of the same transaction.
 *
 * @param prisma  - A Prisma client (or transaction client) that exposes
 *                  `invoiceCounter`.
 * @param txDate  - The timestamp of the invoice (used to derive the WIB date).
 * @returns       - A string like `"INV-20250116-0001"`.
 *
 * @example
 * ```ts
 * const invoiceNumber = await prisma.$transaction(async (tx) => {
 *   return generateInvoiceNumber(tx, new Date());
 * });
 * ```
 */
export async function generateInvoiceNumber(
  prisma: PrismaWithInvoiceCounter,
  txDate: Date,
): Promise<string> {
  const dateStr = toWibDateString(txDate);

  // Atomically upsert the counter for today.
  // - On first invoice of the day: creates a row with counter = 1.
  // - On subsequent invoices: increments the existing counter by 1.
  const record = await prisma.invoiceCounter.upsert({
    where: { date: dateStr },
    create: { date: dateStr, counter: 1 },
    update: { counter: { increment: 1 } },
  });

  const sequence = String(record.counter).padStart(4, "0");
  return `INV-${dateStr}-${sequence}`;
}
