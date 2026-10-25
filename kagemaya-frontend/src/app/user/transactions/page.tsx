'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { formatRupiah, formatDateTime, formatDate, getImageUrl } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Eye,
  FileCheck,
} from 'lucide-react';

interface TransactionItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  ticket_type: {
    name: string;
  };
}

interface TransactionRecord {
  id: string;
  total_price: number;
  voucher_discount: number;
  coupon_discount: number;
  points_used: number;
  final_price: number;
  status: 'WAITING_PAYMENT' | 'WAITING_CONFIRMATION' | 'DONE' | 'REJECTED' | 'EXPIRED' | 'CANCELED';
  payment_deadline: string;
  payment_proof_url?: string | null;
  created_at: string;
  event: {
    id: string;
    title: string;
    banner_url?: string | null;
    start_date: string;
    city: string;
    location: string;
  };
  transaction_items: TransactionItem[];
}

export default function UserTransactionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Tab Definitions
  const tabs = [
    { key: 'ALL', label: 'Semua Pesanan' },
    { key: 'WAITING_PAYMENT', label: 'Menunggu Bayar' },
    { key: 'WAITING_CONFIRMATION', label: 'Menunggu Verifikasi' },
    { key: 'DONE', label: 'Selesai' },
    { key: 'EXPIRED', label: 'Kedaluwarsa' },
    { key: 'CANCELED', label: 'Dibatalkan' },
  ];

  // 1. Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/user/transactions');
    }
  }, [user, authLoading, router]);

  // 2. Fetch User Transactions
  const fetchTransactions = async (tabKey: string) => {
    try {
      setLoading(true);
      const queryParam = tabKey !== 'ALL' ? `?status=${tabKey}` : '';
      const res = await api.get(`/transactions/my-transactions${queryParam}`);

      if (res.data?.success) {
        setTransactions(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Fetch transactions error:', err);
      setToast({ message: 'Gagal memuat riwayat transaksi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchTransactions(activeTab);
    }
  }, [user, authLoading, activeTab]);

  // Handle Cancel Transaction (Rollback Engine Day 14)
  const handleCancel = async (txId: string) => {
    const confirmCancel = window.confirm(
      'Apakah Anda yakin ingin membatalkan pesanan ini? Kuota tiket, kupon, dan saldo poin yang digunakan akan segera dikembalikan.'
    );
    if (!confirmCancel) return;

    try {
      setCancelingId(txId);
      const res = await api.post(`/transactions/${txId}/cancel`);

      if (res.data?.success) {
        setToast({
          message: 'Transaksi berhasil dibatalkan. Kuota tiket dan poin Anda telah dipulihkan.',
          type: 'success',
        });
        // Refresh list
        fetchTransactions(activeTab);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal membatalkan transaksi.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setCancelingId(null);
    }
  };

  // Helper Badge Status
  const renderStatusBadge = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'WAITING_PAYMENT':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-kage-gold/20 text-kage-gold border border-kage-gold/40 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Menunggu Pembayaran
          </span>
        );
      case 'WAITING_CONFIRMATION':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Menunggu Verifikasi Admin
          </span>
        );
      case 'DONE':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-kage-success/20 text-kage-success border border-kage-success/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Transaksi Selesai
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-kage-error/20 text-kage-error border border-kage-error/40 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Kedaluwarsa
          </span>
        );
      case 'CANCELED':
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-kage-mist-dim/20 text-kage-mist border border-kage-mist-dim/40 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-kage-yoru-light text-kage-mist border border-kage-border">
            {status}
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Memverifikasi otentikasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Halaman */}
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl text-kage-washi font-medium">
          Riwayat Transaksi Saya
        </h1>
        <p className="text-xs text-kage-mist">
          Pantau status pesanan tiket, unggah bukti bayar, atau tinjau e-tiket acara Anda.
        </p>
      </div>

      {/* Tab Filter Status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-kage-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-kage-gold text-kage-black font-semibold shadow-sm'
                  : 'bg-kage-yoru text-kage-mist hover:text-kage-washi border border-kage-border hover:border-kage-mist-dim'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Konten Daftar Transaksi */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
          <p className="text-xs text-kage-mist">Memuat daftar pesanan Anda...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-20 rounded-lg bg-kage-yoru border border-kage-border text-center space-y-4">
          <Ticket className="w-10 h-10 text-kage-mist-dim mx-auto" />
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-kage-washi">Belum Ada Transaksi</h3>
            <p className="text-xs text-kage-mist">
              Tidak ada transaksi ditemukan pada kategori ini.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded bg-kage-gold text-kage-black font-semibold text-xs hover:bg-yellow-500 transition"
          >
            Jelajahi Event Sinema
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {transactions.map((tx) => {
            const isWaitingPayment = tx.status === 'WAITING_PAYMENT';
            const isExpired = tx.status === 'EXPIRED';
            const isCanceled = tx.status === 'CANCELED';

            return (
              <div
                key={tx.id}
                className="p-5 rounded-lg bg-kage-yoru border border-kage-border hover:border-kage-border-light transition space-y-4 shadow-md"
              >
                {/* Baris Atas: Tanggal, ID, & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-kage-border pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-kage-mist-dim">
                    <span>Dipesan pada {formatDateTime(tx.created_at)}</span>
                    <span>•</span>
                    <span className="font-mono">ID: {tx.id.slice(0, 13)}...</span>
                  </div>
                  <div>{renderStatusBadge(tx.status)}</div>
                </div>

                {/* Baris Tengah: Info Event & Tiket */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Event Thumbnail & Info (7 cols) */}
                  <div className="md:col-span-7 flex gap-4 items-center">
                    <div className="w-16 h-20 rounded overflow-hidden bg-kage-black shrink-0 border border-kage-border">
                      <img
                        src={getImageUrl(tx.event?.banner_url)}
                        alt={tx.event?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <Link
                        href={`/events/${tx.event?.id}`}
                        className="font-serif text-sm font-medium text-kage-washi hover:text-kage-gold transition truncate block"
                      >
                        {tx.event?.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-kage-mist-dim">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-kage-gold" />
                          {formatDate(tx.event?.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-kage-gold" />
                          {tx.event?.city}
                        </span>
                      </div>
                      <div className="text-xs text-kage-mist">
                        Tiket:{' '}
                        <span className="text-kage-washi font-medium">
                          {tx.transaction_items.map((i) => `${i.ticket_type.name} (${i.quantity}x)`).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nominal Bayar (5 cols) */}
                  <div className="md:col-span-5 flex flex-col md:items-end justify-center space-y-1">
                    <span className="text-[11px] text-kage-mist-dim uppercase tracking-wider">
                      Total Pembayaran:
                    </span>
                    <span className="font-serif text-xl font-bold text-kage-gold">
                      {formatRupiah(tx.final_price)}
                    </span>
                    {tx.points_used > 0 && (
                      <span className="text-[10px] text-kage-mist">
                        (Termasuk potongan {tx.points_used.toLocaleString('id-ID')} Poin)
                      </span>
                    )}
                  </div>
                </div>

                {/* Baris Bawah: Aksi & Informasi Kedaluwarsa */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-kage-border/50">
                  {/* Feedback Status Khusus */}
                  <div>
                    {isWaitingPayment && (
                      <span className="text-[11px] text-kage-gold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Batas transfer: {formatDateTime(tx.payment_deadline)}
                      </span>
                    )}
                    {(isExpired || isCanceled) && (
                      <span className="text-[11px] text-kage-mist-dim flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-kage-success" />
                        Kuota tiket dan saldo poin telah dipulihkan secara otomatis.
                      </span>
                    )}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isWaitingPayment && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCancel(tx.id)}
                          disabled={cancelingId === tx.id}
                          className="px-3 py-1.5 rounded text-xs text-kage-error hover:bg-kage-error/10 border border-kage-error/30 transition disabled:opacity-50"
                        >
                          {cancelingId === tx.id ? 'Membatalkan...' : 'Batalkan'}
                        </button>
                        <Link
                          href={`/transactions/${tx.id}/pay`}
                          className="px-4 py-1.5 rounded text-xs font-semibold bg-kage-gold hover:bg-yellow-500 text-kage-black transition flex items-center gap-1 shadow-sm"
                        >
                          <span>Unggah Bukti Bayar</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </>
                    )}

                    {tx.status === 'WAITING_CONFIRMATION' && (
                      <Link
                        href={`/transactions/${tx.id}/pay`}
                        className="px-3.5 py-1.5 rounded text-xs font-medium border border-kage-border text-kage-washi hover:border-kage-gold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Bukti Bayar</span>
                      </Link>
                    )}

                    {tx.status === 'DONE' && (
                      <Link
                        href={`/events/${tx.event?.id}`}
                        className="px-3.5 py-1.5 rounded text-xs font-semibold bg-kage-success/20 text-kage-success border border-kage-success/40 hover:bg-kage-success/30 transition flex items-center gap-1"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Tiket Aktif</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
