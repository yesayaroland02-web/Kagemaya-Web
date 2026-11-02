'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Ticket,
  Upload,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { TicketData } from '@/types/ticket';
import TicketDisplay from '@/components/ticket/TicketDisplay';

export default function TransactionTicketPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const transactionId = params?.id as string;
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/transactions/${transactionId}/ticket`);
      return;
    }

    if (transactionId && user) {
      fetchTransactionDetail();
    }
  }, [transactionId, user, authLoading]);

  const fetchTransactionDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/transactions/${transactionId}`);
      if (res.data?.data) {
        setTicket(res.data.data);
      } else {
        setError('Data transaksi tidak ditemukan.');
      }
    } catch (err: any) {
      console.error('Failed to fetch transaction ticket:', err);
      const msg =
        err.response?.data?.message ||
        'Gagal memuat tiket transaksi. Pastikan Anda memiliki akses ke transaksi ini.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-kage-black flex flex-col items-center justify-center p-6 text-kage-mist">
        <Loader2 className="w-10 h-10 text-kage-gold animate-spin mb-4" />
        <p className="font-serif text-sm">Menyiapkan e-tiket resmi Anda...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-kage-black py-16 px-4">
        <div className="max-w-md mx-auto p-6 rounded-xl bg-kage-yoru border border-kage-border text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-kage-red/15 border border-kage-red/30 flex items-center justify-center text-kage-red">
            <FileQuestion className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-lg font-bold text-kage-washi">
            Tiket Tidak Ditemukan
          </h2>
          <p className="text-xs text-kage-mist leading-relaxed">
            {error || 'Transaksi tidak dapat diakses atau belum tersedia.'}
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/user/transactions"
              className="px-4 py-2 rounded-lg bg-kage-gold text-kage-black text-xs font-semibold hover:bg-yellow-500 transition"
            >
              Lihat Riwayat Transaksi Saya
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-kage-border text-kage-mist hover:text-kage-washi text-xs font-medium transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle status if NOT DONE
  if (ticket.status !== 'DONE') {
    return (
      <div className="min-h-screen bg-kage-black py-16 px-4">
        <div className="max-w-lg mx-auto p-6 rounded-xl bg-kage-yoru border border-kage-border text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-kage-gold/15 border border-kage-gold/30 flex items-center justify-center text-kage-gold">
            {ticket.status === 'WAITING_PAYMENT' ? (
              <Upload className="w-8 h-8" />
            ) : ticket.status === 'WAITING_CONFIRMATION' ? (
              <Clock className="w-8 h-8 animate-pulse" />
            ) : (
              <AlertCircle className="w-8 h-8 text-kage-error" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-kage-washi">
              {ticket.status === 'WAITING_PAYMENT'
                ? 'Menunggu Pembayaran'
                : ticket.status === 'WAITING_CONFIRMATION'
                ? 'Menunggu Konfirmasi Penyelenggara'
                : 'Tiket Tidak Aktif'}
            </h2>
            <p className="text-xs text-kage-mist max-w-sm mx-auto leading-relaxed">
              {ticket.status === 'WAITING_PAYMENT' ? (
                'E-tiket hanya dapat diterbitkan setelah Anda mengunggah bukti pembayaran dan disetujui oleh EO.'
              ) : ticket.status === 'WAITING_CONFIRMATION' ? (
                'Bukti bayar Anda telah kami terima dan sedang ditinjau oleh pihak penyelenggara acara. E-tiket akan segera aktif otomatis setelah disetujui.'
              ) : (
                `Status transaksi saat ini adalah ${ticket.status}. E-tiket tidak dapat diterbitkan.`
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {ticket.status === 'WAITING_PAYMENT' && (
              <Link
                href={`/transactions/${ticket.id}/pay`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-kage-gold hover:bg-yellow-500 text-kage-black text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Bukti Bayar</span>
              </Link>
            )}
            <Link
              href="/user/transactions"
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-kage-border hover:bg-kage-yoru-light text-kage-mist hover:text-kage-washi text-xs font-medium transition"
            >
              Lihat Riwayat Transaksi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main View: Ticket Display for DONE status
  return (
    <div className="min-h-screen bg-kage-black py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/user/transactions"
            className="inline-flex items-center gap-2 text-xs text-kage-mist hover:text-kage-gold transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Riwayat Transaksi</span>
          </Link>

          <Link
            href={`/events/${ticket.event.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-kage-mist-dim hover:text-kage-washi transition"
          >
            <span>Detail Acara</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* E-Ticket Display Component */}
        <TicketDisplay ticket={ticket} />
      </div>
    </div>
  );
}
