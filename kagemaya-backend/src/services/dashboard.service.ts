import { TransactionStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface DashboardStatsResponse {
  metrics: {
    total_sales: number;
    tickets_sold: number;
    active_events: number;
    total_events: number;
  };
  chart_data: Array<{
    date: string;
    revenue: number;
    tickets: number;
    transactions: number;
  }>;
  recent_transactions: Array<{
    id: string;
    customer_name: string;
    event_title: string;
    amount: number;
    status: string;
    created_at: Date;
  }>;
}

export const getOrganizerDashboardStatsService = async (
  organizerId: string,
  days: number = 30
): Promise<DashboardStatsResponse> => {
  const now = new Date();

  // 1. Hitung Event Aktif & Total Event
  const totalEvents = await prisma.event.count({
    where: { organizer_id: organizerId },
  });

  const activeEvents = await prisma.event.count({
    where: {
      organizer_id: organizerId,
      end_date: { gte: now },
    },
  });

  // 2. Ambil Semua Transaksi Sukses (DONE) milik Event Organizer ini
  const successfulTransactions = await prisma.transaction.findMany({
    where: {
      event: { organizer_id: organizerId },
      status: TransactionStatus.DONE,
    },
    include: {
      transaction_items: true,
    },
  });

  // Hitung Total Penjualan (Revenue) & Tiket Terjual (Total Qty)
  const totalSales = successfulTransactions.reduce(
    (sum, t) => sum + (t.final_price || 0),
    0
  );

  const ticketsSold = successfulTransactions.reduce((sum, t) => {
    const itemsCount = t.transaction_items.reduce(
      (iSum, item) => iSum + item.quantity,
      0
    );
    return sum + itemsCount;
  }, 0);

  // 3. Siapkan Data Time-series Grafik (default: N hari ke belakang)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  // Buat dictionary rentang tanggal YYYY-MM-DD agar tanggal tanpa transaksi tetap bernilai 0
  const dateMap = new Map<string, { revenue: number; tickets: number; transactions: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split('T')[0];
    dateMap.set(dateKey, { revenue: 0, tickets: 0, transactions: 0 });
  }

  // Agregasi transaksi ke dalam dateMap
  successfulTransactions.forEach((t) => {
    const tDate = new Date(t.created_at);
    const dateKey = tDate.toISOString().split('T')[0];

    if (dateMap.has(dateKey)) {
      const entry = dateMap.get(dateKey)!;
      entry.revenue += t.final_price;
      entry.transactions += 1;
      const tTickets = t.transaction_items.reduce((s, it) => s + it.quantity, 0);
      entry.tickets += tTickets;
    }
  });

  const chartData = Array.from(dateMap.entries()).map(([date, val]) => ({
    date,
    revenue: val.revenue,
    tickets: val.tickets,
    transactions: val.transactions,
  }));

  // 4. Ambil 5 Transaksi Terbaru (Sebagai widget tambahan dashboard)
  const recentTransactionsRaw = await prisma.transaction.findMany({
    where: {
      event: { organizer_id: organizerId },
    },
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { name: true } },
      event: { select: { title: true } },
    },
  });

  const recentTransactions = recentTransactionsRaw.map((t) => ({
    id: t.id,
    customer_name: t.customer?.name || 'Anonim',
    event_title: t.event?.title || '-',
    amount: t.final_price,
    status: t.status,
    created_at: t.created_at,
  }));

  return {
    metrics: {
      total_sales: totalSales,
      tickets_sold: ticketsSold,
      active_events: activeEvents,
      total_events: totalEvents,
    },
    chart_data: chartData,
    recent_transactions: recentTransactions,
  };
};