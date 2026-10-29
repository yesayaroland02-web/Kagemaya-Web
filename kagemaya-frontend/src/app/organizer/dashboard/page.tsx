'use client';

import {
  ArrowUpRight,
  CalendarCheck,
  Layers,
  Loader2,
  Plus,
  ShieldAlert,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatDateTime, formatRupiah } from '@/lib/utils';

import { DashboardStats } from '@/types/dashboard';
import Link from 'next/link';
import TransactionChart from '@/components/dashboard/TransactionChart';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [followersCount, setFollowersCount] = useState<number>(0);

  const fetchDashboardStats = async (days: number) => {
    try {
      setLoading(true);
      const [statsRes, followersRes] = await Promise.allSettled([
        api.get(`/me/dashboard/stats?days=${days}`),
        api.get('/organizers/me/followers'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.data) {
        setStats(statsRes.value.data.data);
      }

      if (followersRes.status === 'fulfilled' && followersRes.value.data?.data) {
        setFollowersCount(followersRes.value.data.data.total || 0);
      }
    } catch (err) {
      console.error('Gagal memuat statistik dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'ORGANIZER') {
      fetchDashboardStats(daysFilter);
    }
  }, [authLoading, user, daysFilter]);

  // Auth Guard: Hanya boleh diakses oleh ORGANIZER
  if (!authLoading && (!user || user.role !== 'ORGANIZER')) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-kage-red/10 border border-kage-red/30 flex items-center justify-center text-kage-red">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-kage-washi mb-3">
          Akses Khusus Organizer
        </h1>
        <p className="text-kage-mist max-w-md mx-auto mb-8 text-sm">
          Halaman Dashboard Statistik hanya dapat diakses oleh akun mitra organizer.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded bg-kage-red hover:bg-kage-vermilion text-white text-sm font-semibold transition"
        >
          Masuk sebagai Organizer
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kage-yoru text-kage-washi py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 1. TOP HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-kage-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-kage-gold font-semibold bg-kage-gold/10 px-2 py-0.5 rounded border border-kage-gold/20">
                Dashboard Statistik
              </span>
              <span className="text-xs text-kage-mist-dim font-serif">ダッシュボード · Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-kage-washi mt-1">
              Selamat Datang, {user?.name || 'Organizer'}
            </h1>
            <p className="text-xs text-kage-mist-dim mt-1">
              Ringkasan performa penjualan tiket, audiens pengikut, dan metrik event Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organizer/followers"
              className="px-4 py-2 rounded text-xs font-medium border border-kage-border hover:border-kage-gold text-kage-washi transition flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-kage-gold" />
              <span>Pengikut Saya</span>
            </Link>
            <Link
              href="/organizer/events"
              className="px-4 py-2 rounded text-xs font-medium border border-kage-border hover:border-kage-gold text-kage-washi transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-kage-gold" />
              <span>Kelola Event</span>
            </Link>
            <Link
              href="/organizer/events/create"
              className="px-4 py-2 rounded text-xs font-semibold bg-kage-red hover:bg-kage-vermilion text-white shadow-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Event</span>
            </Link>
          </div>
        </div>

        {/* 2. TIMEFRAME FILTER */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-kage-mist">Periode Data:</span>
          <div className="flex gap-2">
            {[
              { label: '7 Hari', val: 7 },
              { label: '30 Hari', val: 30 },
              { label: '90 Hari', val: 90 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setDaysFilter(p.val)}
                className={`px-3 py-1 text-xs rounded border transition ${
                  daysFilter === p.val
                    ? 'border-kage-gold bg-kage-gold/10 text-kage-gold font-semibold'
                    : 'border-kage-border text-kage-mist hover:text-kage-washi'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && !stats ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-kage-gold mb-3" />
            <p className="text-xs text-kage-mist">Memuat data analitik organizer...</p>
          </div>
        ) : (
          <>
            {/* 3. METRIC CARDS (4 KARTU: PENJUALAN, TIKET, EVENT, DAN PENGIKUT) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Total Penjualan */}
              <div className="bg-kage-yoru-card border border-kage-border rounded-lg p-5 relative overflow-hidden group hover:border-kage-gold/50 transition">
                <div className="flex items-center justify-between text-kage-mist-dim text-xs mb-3">
                  <span>Total Penjualan</span>
                  <div className="p-2 rounded bg-kage-gold/10 text-kage-gold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-kage-washi">
                  {formatRupiah(stats?.metrics.total_sales || 0)}
                </div>
                <p className="text-[11px] text-kage-mist-dim mt-2">
                  Akumulasi penjualan transaksi berhasil.
                </p>
              </div>

              {/* Card 2: Tiket Terjual */}
              <div className="bg-kage-yoru-card border border-kage-border rounded-lg p-5 relative overflow-hidden group hover:border-kage-gold/50 transition">
                <div className="flex items-center justify-between text-kage-mist-dim text-xs mb-3">
                  <span>Tiket Terjual</span>
                  <div className="p-2 rounded bg-kage-red/10 text-kage-red">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-kage-washi">
                  {stats?.metrics.tickets_sold || 0}{' '}
                  <span className="text-xs font-sans font-normal text-kage-mist">Tiket</span>
                </div>
                <p className="text-[11px] text-kage-mist-dim mt-2">
                  Total tiket terkonfirmasi di semua event.
                </p>
              </div>

              {/* Card 3: Event Aktif */}
              <div className="bg-kage-yoru-card border border-kage-border rounded-lg p-5 relative overflow-hidden group hover:border-kage-gold/50 transition">
                <div className="flex items-center justify-between text-kage-mist-dim text-xs mb-3">
                  <span>Event Aktif</span>
                  <div className="p-2 rounded bg-kage-success/10 text-kage-success">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-bold text-kage-washi">
                  {stats?.metrics.active_events || 0}{' '}
                  <span className="text-xs font-sans font-normal text-kage-mist">
                    / {stats?.metrics.total_events || 0} Total
                  </span>
                </div>
                <p className="text-[11px] text-kage-mist-dim mt-2">
                  Jumlah event yang sedang/akan berlangsung.
                </p>
              </div>

              {/* Card 4: Pengikut (Followers) */}
              <Link
                href="/organizer/followers"
                className="bg-kage-yoru-card border border-kage-border rounded-lg p-5 relative overflow-hidden group hover:border-kage-gold transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-kage-mist-dim text-xs mb-3">
                    <span>Pengikut (Followers)</span>
                    <div className="p-2 rounded bg-kage-gold/15 text-kage-gold group-hover:bg-kage-gold group-hover:text-kage-black transition">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-serif text-2xl font-bold text-kage-gold font-mono">
                    {followersCount}{' '}
                    <span className="text-xs font-sans font-normal text-kage-mist">Penonton</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-kage-mist-dim mt-2 pt-2 border-t border-kage-border/40 group-hover:text-kage-gold transition">
                  <span>Kelola &amp; Lihat Pengikut</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </Link>

            </div>

            {/* 4. GRAFIK TRANSAKSI (CHART.JS / RECHARTS) */}
            <TransactionChart data={stats?.chart_data || []} />

            {/* 5. TABEL TRANSAKSI TERBARU */}
            <div className="bg-kage-yoru-card border border-kage-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-semibold text-kage-washi text-base">
                    Transaksi Terbaru
                  </h3>
                  <p className="text-xs text-kage-mist-dim">
                    5 pesanan tiket terkini yang masuk ke event Anda.
                  </p>
                </div>
                <Link
                    href="/organizer/transactions"
                    className="text-xs text-kage-gold hover:underline flex items-center gap-1"
                    >
                    Lihat Semua Transaksi <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-kage-border text-kage-mist-dim uppercase">
                        <th className="py-2.5 px-3">ID Transaksi</th>
                        <th className="py-2.5 px-3">Pembeli</th>
                        <th className="py-2.5 px-3">Event</th>
                        <th className="py-2.5 px-3">Nominal</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-kage-border/50">
                      {stats.recent_transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-kage-yoru-light/50 transition">
                          <td className="py-3 px-3 font-mono text-[11px] text-kage-mist">
                            {tx.id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-3 font-medium text-kage-washi">
                            {tx.customer_name}
                          </td>
                          <td className="py-3 px-3 text-kage-mist truncate max-w-xs">
                            {tx.event_title}
                          </td>
                          <td className="py-3 px-3 font-semibold text-kage-washi">
                            {formatRupiah(tx.amount)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                tx.status === 'DONE'
                                  ? 'bg-kage-success/15 text-kage-success border border-kage-success/30'
                                  : tx.status === 'WAITING_CONFIRMATION'
                                  ? 'bg-kage-gold/15 text-kage-gold border border-kage-gold/30'
                                  : 'bg-kage-border text-kage-mist'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-kage-mist-dim text-[11px]">
                            {formatDateTime(tx.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-kage-mist-dim">
                  Belum ada transaksi masuk pada event Anda.
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
