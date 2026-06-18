"use client";

import { InvoiceResponse } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatCurrency";

interface PrintHandlerProps {
  invoice: InvoiceResponse;
  storeName: string;
}

/**
 * Renders two hidden print-only layouts (80mm struk and full invoice),
 * and exposes two print trigger buttons.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
export default function PrintHandler({ invoice, storeName }: PrintHandlerProps) {
  const formattedDate = new Date(invoice.tanggalWaktu).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function printStruk() {
    document.body.dataset.printMode = "struk";
    window.print();
    delete document.body.dataset.printMode;
  }

  function printFull() {
    document.body.dataset.printMode = "full";
    window.print();
    delete document.body.dataset.printMode;
  }

  return (
    <>
      {/* Print trigger buttons — hidden during print */}
      <div className="no-print flex gap-2 mt-4">
        <button
          onClick={printStruk}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
        >
          Cetak Struk
        </button>
        <button
          onClick={printFull}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
        >
          Cetak Invoice Lengkap
        </button>
      </div>

      {/* ── Struk 80mm layout (print-struk) ─────────────────────────────── */}
      <div className="print-struk hidden struk-layout">
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <strong>{storeName}</strong>
        </div>
        <div style={{ fontSize: "9pt", marginBottom: "4px" }}>
          <div>No: {invoice.nomorInvoice}</div>
          <div>Tanggal: {formattedDate}</div>
        </div>
        <hr style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
          <tbody>
            {invoice.itemLines.map((line, idx) => (
              <tr key={idx}>
                <td style={{ verticalAlign: "top" }}>
                  <div>{line.namaBarang}</div>
                  <div style={{ paddingLeft: "8px" }}>
                    {line.kuantitas} × {formatCurrency(line.hargaSatuan)}
                  </div>
                </td>
                <td style={{ textAlign: "right", verticalAlign: "bottom" }}>
                  {line.status !== "NOT_FOUND"
                    ? formatCurrency(line.subtotal)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
          <span>TOTAL</span>
          <span>{formatCurrency(invoice.totalKeseluruhan)}</span>
        </div>
        <hr style={{ borderTop: "1px dashed #000", margin: "4px 0" }} />
        <div style={{ textAlign: "center", fontSize: "8pt", marginTop: "8px" }}>
          Terima kasih atas pembelian Anda!
        </div>
      </div>

      {/* ── Full invoice layout (print-full) ─────────────────────────────── */}
      <div className="print-full hidden">
        <div style={{ marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "14pt" }}>{storeName}</h2>
          <div style={{ fontSize: "10pt", marginTop: "4px" }}>
            <strong>No Invoice:</strong> {invoice.nomorInvoice}
          </div>
          <div style={{ fontSize: "10pt" }}>
            <strong>Tanggal:</strong> {formattedDate}
          </div>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "10pt",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #000" }}>
              <th style={{ textAlign: "left", padding: "4px" }}>No</th>
              <th style={{ textAlign: "left", padding: "4px" }}>Nama Produk</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Kuantitas</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Harga Satuan</th>
              <th style={{ textAlign: "right", padding: "4px" }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.itemLines.map((line, idx) => (
              <tr
                key={idx}
                style={{ borderBottom: "1px solid #ccc" }}
              >
                <td style={{ padding: "4px" }}>{idx + 1}</td>
                <td style={{ padding: "4px" }}>
                  {line.status === "NOT_FOUND" ? (
                    <span>
                      {line.namaBarang}{" "}
                      <span style={{ color: "red" }}>⚠ Produk Tidak Ditemukan</span>
                    </span>
                  ) : (
                    line.namaBarang
                  )}
                </td>
                <td style={{ textAlign: "right", padding: "4px" }}>{line.kuantitas}</td>
                <td style={{ textAlign: "right", padding: "4px" }}>
                  {line.status !== "NOT_FOUND"
                    ? formatCurrency(line.hargaSatuan)
                    : "—"}
                </td>
                <td style={{ textAlign: "right", padding: "4px" }}>
                  {line.status !== "NOT_FOUND"
                    ? formatCurrency(line.subtotal)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #000", fontWeight: "bold" }}>
              <td colSpan={4} style={{ textAlign: "right", padding: "6px" }}>
                Total Keseluruhan
              </td>
              <td style={{ textAlign: "right", padding: "6px" }}>
                {formatCurrency(invoice.totalKeseluruhan)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
