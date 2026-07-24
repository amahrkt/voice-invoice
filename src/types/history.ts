export interface HistoryInvoice {
  id: string;
  nomorInvoice: string;
  tanggalWaktu: string;       // ISO string
  totalKeseluruhan: number;
  items: HistoryInvoiceItem[];
}

export interface HistoryInvoiceItem {
  id: string;
  namaBarang: string;
  kuantitas: number;
  hargaSatuan: number;
  subtotal: number;
  status: 'OK' | 'NOT_FOUND' | 'AMBIGUOUS';
}
