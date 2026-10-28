'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  ShieldAlert,
  Ticket,
  User,
  X,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { formatDateTime, formatRupiah, getImageUrl } from '@/lib/utils';

import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

interface TransactionItem {
  id: string;
  customer_id: string;
  total_price: number;
  final_price: number;
  status: 'WAITING_PAYMENT' | 'WAITING_CONFIRMATION' | 'DONE' | 'REJECTED' | 'EXPIRED' | 'CANCELED';
  payment_proof_url: string | null;
  payment_proof_uploaded_at: string | null;
  payment_deadline: string;
  created_at: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    city: string;
  };
  transaction_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    ticket_type: {
      name: string;
    };
  }>;
}

export default function OrganizerTransactionsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING_CONFIRMATION' | 'DONE' | 'REJECTED'>('ALL');

  // Modal Preview Bukti Bayar State
  const [selectedProofTx, setSelectedProofTx] = useState<TransactionItem | null>(null);

  // Modal Konfirmasi / Reject State
  const [actionTx, setActionTx] = useState<TransactionItem | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Transaksi
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions/organizer/incoming-transactions');
      if (res.data?.data) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Gagal memuat transaksi masuk:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'ORGANIZER') {
      fetchTransactions();
    }
  }, [authLoading, user]);

  // Eksekusi Accept Pembayaran
  const handleConfirmAccept = async () => {
    if (!actionTx) return;
    try {
      setSubmittingAction(true);
      await api.patch(`/transactions/${actionTx.id}/accept`);
      
      // Update data di state lokal
      setTransactions((prev) =>
        prev.map((t) => (t.id === actionTx.id ? { ...t, status: 'DONE' } : t))
      );
      
      alert(`Transaksi #${actionTx.id.slice(0, 8)} berhasil diterima. Tiket telah diterbitkan.`);
      setActionTx(null);
      setActionType(null);
      if (selectedProofTx?.id === actionTx.id) setSelectedProofTx(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menerima transaksi.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Eksekusi Reject Pembayaran
  const handleConfirmReject = async () => {
    if (!actionTx) return;
    if (!rejectReason.trim()) {
      alert('Mohon cantumkan alasan penolakan.');
      return;
    }

    try {
      setSubmittingAction(true);
      await api.patch(`/transactions/${actionTx.id}/reject`, { reason: rejectReason });
      
      // Update data di state lokal
      setTransactions((prev) =>
        prev.map((t) => (t.id === actionTx.id ? { ...t, status: 'REJECTED' } : t))
      );

      alert(`Transaksi #${actionTx.id.slice(0, 8)} telah ditolak dan kuota tiket berhasil di-rollback.`);
      setActionTx(null);
      setActionType(null);
      setRejectReason('');
      if (selectedProofTx?.id === actionTx.id) setSelectedProofTx(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menolak transaksi.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter Data Berdasarkan Tab
  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === 'ALL') return true;
    return t.status === activeTab;
  });

  const waitingCount = transactions.filter((t) => t.status === 'WAITING_CONFIRMATION').length;
  const doneCount = transactions.filter((t) => t.status === 'DONE').length;
  const rejectedCount = transactions.filter((t) => t.status === 'REJECTED' || t.status === 'CANCELED').length;

  // Auth Guard
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
          Halaman verifikasi transaksi hanya dapat diakses oleh akun mitra organizer.
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
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. TOP HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-kage-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/organizer/dashboard"
                className="text-xs text-kage-mist hover:text-kage-gold flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-kage-washi">
              Verifikasi & Manajemen Transaksi
            </h1>
            <p className="text-xs text-kage-mist-dim mt-1">
              Periksa bukti transfer manual peserta dan tentukan persetujuan tiket resmi event Anda.
            </p>
          </div>
        </div>

        {/* 2. METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-kage-yoru-card border border-kage-border">
            <span className="text-xs text-kage-gold flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-kage-gold" /> Perlu Konfirmasi
            </span>
            <div className="font-serif text-2xl font-bold text-kage-washi mt-2">
              {waitingCount} <span className="text-xs font-sans text-kage-mist font-normal">Transaksi</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-kage-yoru-card border border-kage-border">
            <span className="text-xs text-kage-success flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-kage-success" /> Berhasil Diterima
            </span>
            <div className="font-serif text-2xl font-bold text-kage-washi mt-2">
              {doneCount} <span className="text-xs font-sans text-kage-mist font-normal">Transaksi</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-kage-yoru-card border border-kage-border">
            <span className="text-xs text-kage-vermilion flex items-center gap-1.5 font-medium">
              <XCircle className="w-4 h-4 text-kage-vermilion" /> Ditolak / Dibatalkan
            </span>
            <div className="font-serif text-2xl font-bold text-kage-washi mt-2">
              {rejectedCount} <span className="text-xs font-sans text-kage-mist font-normal">Transaksi</span>
            </div>
          </div>
        </div>

        {/* 3. STATUS TABS */}
        <div className="flex gap-2 border-b border-kage-border pb-3 overflow-x-auto text-xs">
          {[
            { key: 'ALL', label: `Semua (${transactions.length})` },
            { key: 'WAITING_CONFIRMATION', label: `Perlu Konfirmasi (${waitingCount})` },
            { key: 'DONE', label: `Berhasil (${doneCount})` },
            { key: 'REJECTED', label: `Ditolak (${rejectedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-md font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-kage-gold text-kage-black font-semibold'
                  : 'text-kage-mist hover:text-kage-washi bg-kage-yoru-card border border-kage-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. TABEL TRANSAKSI */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-kage-gold mb-3" />
            <p className="text-xs text-kage-mist">Memuat daftar transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-kage-border rounded-lg">
            <Ticket className="w-10 h-10 text-kage-mist-dim mx-auto mb-2 opacity-50" />
            <p className="text-sm text-kage-washi font-medium">Tidak ada transaksi ditemukan.</p>
            <p className="text-xs text-kage-mist-dim mt-1">Belum ada pesanan pada filter tab ini.</p>
          </div>
        ) : (
          <div className="bg-kage-yoru-card border border-kage-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-kage-border bg-kage-black/40 text-kage-mist-dim uppercase tracking-wider">
                    <th className="py-3 px-4">ID Transaksi</th>
                    <th className="py-3 px-4">Pembeli</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4 text-center">Bukti Bayar</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kage-border/50">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-kage-yoru-light/40 transition">
                      
                      {/* ID Transaksi */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-kage-mist">
                        #{tx.id.slice(0, 8)}
                        <span className="block text-[10px] text-kage-mist-dim font-sans mt-0.5">
                          {formatDateTime(tx.created_at)}
                        </span>
                      </td>

                      {/* Pembeli */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-kage-washi">{tx.customer?.name}</div>
                        <div className="text-[11px] text-kage-mist-dim">{tx.customer?.email}</div>
                      </td>

                      {/* Event & Item Tiket */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-kage-washi truncate">{tx.event?.title}</div>
                        <div className="text-[11px] text-kage-gold mt-0.5">
                          {tx.transaction_items?.map((it) => `${it.quantity}x ${it.ticket_type.name}`).join(', ')}
                        </div>
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 font-semibold text-kage-washi">
                        {formatRupiah(tx.final_price)}
                      </td>

                      {/* Bukti Bayar Button */}
                      <td className="py-3.5 px-4 text-center">
                        {tx.payment_proof_url ? (
                          <button
                            onClick={() => setSelectedProofTx(tx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-kage-border hover:border-kage-gold text-kage-gold bg-kage-gold/5 text-[11px] transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                          </button>
                        ) : (
                          <span className="text-[11px] text-kage-mist-dim italic">Belum Upload</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block ${
                            tx.status === 'DONE'
                              ? 'bg-kage-success/15 text-kage-success border border-kage-success/30'
                              : tx.status === 'WAITING_CONFIRMATION'
                              ? 'bg-kage-gold/15 text-kage-gold border border-kage-gold/30'
                              : tx.status === 'REJECTED'
                              ? 'bg-kage-red/15 text-kage-vermilion border border-kage-red/30'
                              : 'bg-kage-border text-kage-mist'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Aksi Accept / Reject */}
                      <td className="py-3.5 px-4 text-right">
                        {tx.status === 'WAITING_CONFIRMATION' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setActionTx(tx);
                                setActionType('accept');
                              }}
                              className="px-3 py-1 rounded bg-kage-success hover:bg-emerald-600 text-white font-medium text-xs shadow transition"
                            >
                              Terima
                            </button>
                            <button
                              onClick={() => {
                                setActionTx(tx);
                                setActionType('reject');
                                setRejectReason('');
                              }}
                              className="px-3 py-1 rounded bg-kage-red hover:bg-kage-vermilion text-white font-medium text-xs shadow transition"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-kage-mist-dim">Selesai</span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 5. MODAL PREVIEW BUKTI BAYAR                             */}
      {/* ======================================================== */}
      {selectedProofTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-kage-yoru border border-kage-border w-full max-w-xl rounded-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-kage-border">
              <div>
                <h3 className="font-serif font-semibold text-kage-washi text-base">
                  Bukti Pembayaran #{selectedProofTx.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-kage-mist">
                  {selectedProofTx.customer.name} · {formatRupiah(selectedProofTx.final_price)}
                </p>
              </div>
              <button
                onClick={() => setSelectedProofTx(null)}
                className="p-1 rounded text-kage-mist hover:text-kage-washi transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-kage-black/70 flex justify-center items-center min-h-[300px] max-h-[60vh] overflow-auto">
              {selectedProofTx.payment_proof_url ? (
                <img
                  src={getImageUrl(selectedProofTx.payment_proof_url)}
                  alt="Bukti Transfer"
                  className="max-h-[55vh] rounded object-contain border border-kage-border"
                />
              ) : (
                <p className="text-xs text-kage-mist">Gambar tidak ditemukan.</p>
              )}
            </div>

            <div className="p-4 border-t border-kage-border flex items-center justify-between bg-kage-yoru-card">
              <a
                href={getImageUrl(selectedProofTx.payment_proof_url || '')}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-kage-gold hover:underline flex items-center gap-1"
              >
                Buka Tab Baru <ExternalLink className="w-3 h-3" />
              </a>

              {selectedProofTx.status === 'WAITING_CONFIRMATION' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActionTx(selectedProofTx);
                      setActionType('accept');
                    }}
                    className="px-3 py-1.5 rounded bg-kage-success hover:bg-emerald-600 text-white font-medium text-xs transition"
                  >
                    Terima Pembayaran
                  </button>
                  <button
                    onClick={() => {
                      setActionTx(selectedProofTx);
                      setActionType('reject');
                      setRejectReason('');
                    }}
                    className="px-3 py-1.5 rounded bg-kage-red hover:bg-kage-vermilion text-white font-medium text-xs transition"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL KONFIRMASI ACCEPT / REJECT DENGAN INPUT ALASAN  */}
      {/* ======================================================== */}
      {actionTx && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-kage-yoru-card border border-kage-border w-full max-w-md rounded-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header Dialog */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  actionType === 'accept'
                    ? 'bg-kage-success/20 text-kage-success'
                    : 'bg-kage-red/20 text-kage-vermilion'
                }`}
              >
                {actionType === 'accept' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-serif font-bold text-kage-washi text-lg">
                  {actionType === 'accept' ? 'Terima Pembayaran?' : 'Tolak Pembayaran?'}
                </h3>
                <p className="text-xs text-kage-mist">
                  ID: #{actionTx.id.slice(0, 8)} · {actionTx.customer.name}
                </p>
              </div>
            </div>

            {/* Content Body */}
            {actionType === 'accept' ? (
              <p className="text-xs text-kage-mist leading-relaxed">
                Konfirmasi pembayaran sebesar{' '}
                <strong className="text-kage-washi">{formatRupiah(actionTx.final_price)}</strong>.
                Status transaksi akan berubah menjadi <strong className="text-kage-success">DONE</strong> dan tiket resmi akan otomatis dikirimkan ke pembeli.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-kage-mist leading-relaxed">
                  Transaksi akan ditandai <strong className="text-kage-vermilion">REJECTED</strong>. Kuota kursi event, kupon, dan poin customer akan otomatis dipulihkan (rollback) oleh sistem.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-kage-washi mb-1">
                    Alasan Penolakan <span className="text-kage-red">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Bukti transfer buram / nominal tidak sesuai / nama rekening berbeda."
                    className="w-full text-xs p-2.5 rounded bg-kage-yoru border border-kage-border focus:border-kage-gold outline-none text-kage-washi"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-kage-border">
              <button
                disabled={submittingAction}
                onClick={() => {
                  setActionTx(null);
                  setActionType(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded text-xs font-medium border border-kage-border text-kage-mist hover:text-kage-washi transition"
              >
                Batal
              </button>

              {actionType === 'accept' ? (
                <button
                  disabled={submittingAction}
                  onClick={handleConfirmAccept}
                  className="px-4 py-2 rounded text-xs font-semibold bg-kage-success hover:bg-emerald-600 text-white flex items-center gap-1.5 shadow transition disabled:opacity-50"
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Ya, Terima Pembayaran
                </button>
              ) : (
                <button
                  disabled={submittingAction}
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded text-xs font-semibold bg-kage-red hover:bg-kage-vermilion text-white flex items-center gap-1.5 shadow transition disabled:opacity-50"
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tolak & Rollback
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}