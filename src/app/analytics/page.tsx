'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AnalyticsPeriod, AnalyticsResponse } from '@/types/analytics';
import { formatCurrency } from '@/lib/formatCurrency';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'day', label: 'Per Hari' },
  { value: 'week', label: 'Per Minggu' },
  { value: 'month', label: 'Per Bulan' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('day');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/analytics?period=${period}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${res.status}`);
        }
        const json: AnalyticsResponse = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Analitik Penjualan</h1>

      {/* Period toggle */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Data content */}
      {!loading && !error && data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Pendapatan</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(data.summary.totalPendapatan)}
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Jumlah Transaksi</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {data.summary.jumlahTransaksi}
              </p>
            </div>
          </div>

          {/* Empty state */}
          {data.buckets.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Tidak ada data transaksi untuk periode ini.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.buckets}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value)), 'Pendapatan']} />
                <Bar dataKey="totalPendapatan" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
