import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { groupByPeriod } from '@/lib/groupByPeriod';
import type { AnalyticsPeriod, AnalyticsResponse } from '@/types/analytics';

const VALID_PERIODS: AnalyticsPeriod[] = ['day', 'week', 'month'];

function getStartDate(period: AnalyticsPeriod): Date {
  const now = new Date();

  switch (period) {
    case 'day': {
      // 30 days ago
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    case 'week': {
      // 12 weeks ago (84 days)
      const d = new Date(now);
      d.setDate(d.getDate() - 12 * 7);
      return d;
    }
    case 'month': {
      // 12 months ago
      const d = new Date(now);
      d.setMonth(d.getMonth() - 12);
      return d;
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const periodParam = searchParams.get('period');

  // Validate period query param
  if (!periodParam || !VALID_PERIODS.includes(periodParam as AnalyticsPeriod)) {
    return NextResponse.json(
      { error: 'Parameter period harus salah satu dari: day, week, month' },
      { status: 400 },
    );
  }

  const period = periodParam as AnalyticsPeriod;
  const startDate = getStartDate(period);

  try {
    const invoices = await prisma.invoice.findMany({
      where: { tanggalWaktu: { gte: startDate } },
      select: { tanggalWaktu: true, totalKeseluruhan: true },
    });

    const buckets = groupByPeriod(invoices, period);

    const summary = {
      totalPendapatan: buckets.reduce((sum, b) => sum + b.totalPendapatan, 0),
      jumlahTransaksi: buckets.reduce((sum, b) => sum + b.jumlahTransaksi, 0),
    };

    const response: AnalyticsResponse = { period, buckets, summary };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[GET /api/analytics]', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 },
    );
  }
}
