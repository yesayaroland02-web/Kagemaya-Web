'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import React, { useState } from 'react';

import { formatRupiah } from '@/lib/utils';

interface ChartItem {
  date: string;
  revenue: number;
  tickets: number;
  transactions: number;
}

interface TransactionChartProps {
  data: ChartItem[];
}

export default function TransactionChart({ data }: TransactionChartProps) {
  const [metricType, setMetricType] = useState<'revenue' | 'tickets'>('revenue');

  // Format label sumbu X (contoh: "14 Okt")
  const formatXAxisDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Custom Tooltip Card
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload as ChartItem;
      return (
        <div className="bg-kage-yoru-light border border-kage-border p-3 rounded shadow-xl text-xs space-y-1">
          <p className="font-semibold text-kage-washi mb-1">{formatXAxisDate(label)}</p>
          <p className="text-kage-gold">
            Pendapatan: <span className="font-bold">{formatRupiah(p.revenue)}</span>
          </p>
          <p className="text-kage-vermilion">
            Tiket Terjual: <span className="font-bold">{p.tickets} tiket</span>
          </p>
          <p className="text-kage-mist-dim">
            Transaksi Sukses: <span className="font-bold">{p.transactions}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-kage-yoru-card border border-kage-border rounded-lg p-5">
      {/* Header Grafik & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-serif font-semibold text-kage-washi">
            Tren Transaksi & Penjualan
          </h2>
          <p className="text-xs text-kage-mist-dim mt-0.5">
            Grafik performa transaksi harian tiket event Anda.
          </p>
        </div>

        {/* Toggle Pilihan Metrik */}
        <div className="inline-flex rounded-md p-1 bg-kage-black/60 border border-kage-border text-xs">
          <button
            onClick={() => setMetricType('revenue')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              metricType === 'revenue'
                ? 'bg-kage-gold text-kage-black shadow'
                : 'text-kage-mist hover:text-kage-washi'
            }`}
          >
            Pendapatan (Rp)
          </button>
          <button
            onClick={() => setMetricType('tickets')}
            className={`px-3 py-1.5 rounded font-medium transition ${
              metricType === 'tickets'
                ? 'bg-kage-red text-white shadow'
                : 'text-kage-mist hover:text-kage-washi'
            }`}
          >
            Jumlah Tiket
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D6A85F" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#D6A85F" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C62828" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#C62828" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#292930" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisDate}
              stroke="#85837F"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#85837F"
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) =>
                metricType === 'revenue'
                  ? val >= 1000000
                    ? `${(val / 1000000).toFixed(1)}jt`
                    : val >= 1000
                    ? `${(val / 1000).toFixed(0)}rb`
                    : `${val}`
                  : `${val}`
              }
            />
            <Tooltip content={<CustomTooltip />} />

            {metricType === 'revenue' ? (
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D6A85F"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#revenueGrad)"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="tickets"
                stroke="#E5484D"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ticketGrad)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}