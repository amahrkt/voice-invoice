export type AnalyticsPeriod = 'day' | 'week' | 'month';

export interface AnalyticsBucket {
  label: string;       // "2025-07-23" | "2025-W29" | "2025-07"
  totalPendapatan: number;
  jumlahTransaksi: number;
}

export interface AnalyticsResponse {
  period: AnalyticsPeriod;
  buckets: AnalyticsBucket[];
  summary: {
    totalPendapatan: number;
    jumlahTransaksi: number;
  };
}
