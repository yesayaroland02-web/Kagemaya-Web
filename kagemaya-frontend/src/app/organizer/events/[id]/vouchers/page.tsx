'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { getImageUrl } from '@/lib/utils';
import { 
  TicketPercent, 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Copy, 
  Check, 
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Percent,
  Coins
} from 'lucide-react';

interface Voucher {
  id: string;
  event_id: string;
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  used_count: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface EventSummary {
  id: string;
  title: string;
  banner_url?: string;
  city: string;
  location: string;
  start_date: string;
  end_date: string;
}

export default function EventVouchersPage() {
  const params = useParams();
  const eventId = params.id as string;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Data states
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Voucher Form States
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI / Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Helper date-time format for input
  const getDefaultDates = () => {
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 30); // 30 days ahead

    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const toInputVal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    return {
      start: toInputVal(now),
      end: toInputVal(end),
    };
  };

  // Fetch Event & Vouchers
  const loadEventAndVouchers = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch Event detail
      const eventRes = await api.get(`/events/${eventId}`);
      if (eventRes.data?.data) {
        setEvent(eventRes.data.data);
      }

      // 2. Fetch Vouchers
      const vouchersRes = await api.get(`/events/${eventId}/vouchers`);
      if (vouchersRes.data?.data) {
        setVouchers(vouchersRes.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching event vouchers:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Gagal memuat data voucher.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      const def = getDefaultDates();
      setStartDate(def.start);
      setEndDate(def.end);
      loadEventAndVouchers();
    }
  }, [eventId]);

  // Handle Copy Voucher Code
  const handleCopyCode = (voucherCode: string) => {
    navigator.clipboard.writeText(voucherCode);
    setCopiedCode(voucherCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handle Form Submit: POST /api/events/:id/vouchers
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      setErrorMessage('Kode voucher wajib diisi.');
      return;
    }

    if (discountType === 'PERCENT' && (discountValue <= 0 || discountValue > 100)) {
      setErrorMessage('Diskon persentase harus antara 1% dan 100%.');
      return;
    }

    if (discountType === 'FIXED' && discountValue <= 0) {
      setErrorMessage('Nominal potongan tetap harus lebih dari Rp 0.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage('Tanggal mulai dan berlaku sampai wajib ditentukan.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setErrorMessage('Masa berlaku selesai harus lebih lambat dari tanggal mulai.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        code: cleanCode,
        discount_type: discountType,
        discount_value: Number(discountValue),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      };

      const res = await api.post(`/events/${eventId}/vouchers`, payload);

      setSuccessMessage(`Voucher promo "${cleanCode}" berhasil diterbitkan!`);
      setCode('');
      if (discountType === 'PERCENT') setDiscountValue(15);
      else setDiscountValue(25000);

      // Refresh list
      if (res.data?.data) {
        setVouchers((prev) => [res.data.data, ...prev]);
      } else {
        loadEventAndVouchers();
      }
    } catch (err: any) {
      console.error('Error creating voucher:', err);
      const backendMsg =
        err.response?.data?.message || err.message || 'Gagal menerbitkan voucher promo.';
      setErrorMessage(backendMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Check if voucher is currently active
  const isVoucherActive = (v: Voucher) => {
    const now = new Date();
    const start = new Date(v.start_date);
    const end = new Date(v.end_date);
    return now >= start && now <= end;
  };

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
          Manajemen voucher hanya dapat diakses oleh penyelenggara acara dengan peran <strong>ORGANIZER</strong>.
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
      <div className="max-w-7xl mx-auto">

        {/* TOP BAR / BREADCRUMB */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-kage-border">
          <div className="flex items-center gap-4">
            <Link
              href={`/organizer/events/${eventId}/edit`}
              className="p-2 rounded bg-kage-yoru-card border border-kage-border text-kage-mist hover:text-kage-gold hover:border-kage-gold transition"
              title="Kembali ke Edit Event"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-kage-gold font-semibold bg-kage-gold/10 px-2 py-0.5 rounded border border-kage-gold/20">
                  Portal Organizer
                </span>
                <span className="text-xs text-kage-mist-dim font-serif">割引 · Voucher Event</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-kage-washi mt-1">
                Kelola Voucher Promo Event
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/events/${eventId}`}
              className="px-4 py-2 rounded text-xs font-medium border border-kage-border text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Halaman Event</span>
            </Link>
          </div>
        </div>

        {/* EVENT SUMMARY CONTEXT CARD */}
        {event && (
          <div className="mb-8 p-4 sm:p-5 rounded-lg bg-kage-black/60 border border-kage-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {event.banner_url ? (
                <img
                  src={getImageUrl(event.banner_url)}
                  alt={event.title}
                  className="w-20 h-12 rounded object-cover border border-kage-border"
                />
              ) : (
                <div className="w-20 h-12 rounded bg-kage-yoru-light border border-kage-border flex items-center justify-center text-kage-gold">
                  <TicketPercent className="w-5 h-5" />
                </div>
              )}
              <div>
                <h2 className="font-serif font-semibold text-base text-kage-washi">
                  {event.title}
                </h2>
                <p className="text-xs text-kage-mist-dim mt-0.5">
                  {event.city} &bull; {event.location}
                </p>
              </div>
            </div>

            <div className="text-xs text-kage-mist flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-kage-gold" />
              <span>
                {new Date(event.start_date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        )}

        {/* FEEDBACK ALERTS */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded bg-kage-error/10 border border-kage-error/30 text-kage-error flex items-start gap-3 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded bg-kage-success/10 border border-kage-success/30 text-kage-success flex items-start gap-3 text-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* MAIN 2 COLUMNS: FORM CREATE VOUCHER (LEFT) & VOUCHERS LIST (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN (5 COLS): FORM BUAT VOUCHER */}
          <div className="lg:col-span-5">
            <div className="bg-kage-black/60 border border-kage-border rounded-lg p-6 backdrop-blur-sm sticky top-24">
              <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-kage-border">
                <Sparkles className="w-5 h-5 text-kage-gold" />
                <h3 className="font-serif text-lg font-medium text-kage-washi">
                  Buat Voucher Promo Baru
                </h3>
              </div>

              <form onSubmit={handleCreateVoucher} className="space-y-4">
                {/* Kode Voucher */}
                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Kode Voucher <span className="text-kage-vermilion">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 text-kage-mist-dim absolute left-3 top-3" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="mis. NOIRFEST15"
                      className="w-full bg-kage-yoru border border-kage-border rounded pl-9 pr-3.5 py-2 text-sm font-mono tracking-wider text-kage-gold placeholder-kage-mist-dim uppercase focus:outline-none focus:border-kage-gold transition"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-kage-mist-dim mt-1">
                    Gunakan huruf kapital dan angka tanpa spasi (mis. PROMO2026).
                  </p>
                </div>

                {/* Tipe & Nilai Diskon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-kage-mist mb-1.5">
                      Tipe Diskon <span className="text-kage-vermilion">*</span>
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => {
                        const val = e.target.value as 'PERCENT' | 'FIXED';
                        setDiscountType(val);
                        if (val === 'PERCENT' && discountValue > 100) {
                          setDiscountValue(15);
                        } else if (val === 'FIXED' && discountValue <= 100) {
                          setDiscountValue(25000);
                        }
                      }}
                      className="w-full bg-kage-yoru border border-kage-border rounded px-3 py-2 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                    >
                      <option value="PERCENT">Persentase (%)</option>
                      <option value="FIXED">Nominal Tetap (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-kage-mist mb-1.5">
                      {discountType === 'PERCENT' ? 'Besaran Diskon (%)' : 'Potongan Harga (IDR)'}{' '}
                      <span className="text-kage-vermilion">*</span>
                    </label>
                    <div className="relative">
                      {discountType === 'PERCENT' ? (
                        <Percent className="w-3.5 h-3.5 text-kage-mist-dim absolute left-3 top-2.5" />
                      ) : (
                        <Coins className="w-3.5 h-3.5 text-kage-mist-dim absolute left-3 top-2.5" />
                      )}
                      <input
                        type="number"
                        min={1}
                        max={discountType === 'PERCENT' ? 100 : undefined}
                        step={discountType === 'PERCENT' ? 1 : 1000}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full bg-kage-yoru border border-kage-border rounded pl-8 pr-3 py-2 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Tanggal Mulai */}
                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Mulai Berlaku <span className="text-kage-vermilion">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-kage-yoru border border-kage-border rounded px-3 py-2 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                    required
                  />
                </div>

                {/* Tanggal Berakhir */}
                <div>
                  <label className="block text-xs font-medium text-kage-mist mb-1.5">
                    Berlaku Sampai <span className="text-kage-vermilion">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-kage-yoru border border-kage-border rounded px-3 py-2 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                    required
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{isSubmitting ? 'Menerbitkan...' : 'Terbitkan Voucher Promo'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (7 COLS): DAFTAR VOUCHER */}
          <div className="lg:col-span-7">
            <div className="bg-kage-black/60 border border-kage-border rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-kage-border">
                <div className="flex items-center gap-2.5">
                  <TicketPercent className="w-5 h-5 text-kage-gold" />
                  <h3 className="font-serif text-lg font-medium text-kage-washi">
                    Daftar Voucher Aktif ({vouchers.length})
                  </h3>
                </div>
                <span className="text-xs text-kage-mist-dim font-serif">Kagemaya Perks</span>
              </div>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-kage-mist">
                  <Loader2 className="w-6 h-6 animate-spin text-kage-gold mb-2" />
                  <span className="text-xs">Memuat daftar voucher...</span>
                </div>
              ) : vouchers.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-kage-border rounded-lg">
                  <TicketPercent className="w-10 h-10 text-kage-mist-dim mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium text-kage-washi">Belum Ada Voucher</p>
                  <p className="text-xs text-kage-mist-dim mt-1 max-w-xs mx-auto">
                    Buat kode promo pertama Anda untuk menarik penonton sinema dan meningkatkan penjualan tiket.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vouchers.map((v) => {
                    const active = isVoucherActive(v);
                    return (
                      <div
                        key={v.id}
                        className="p-4 rounded-lg border border-kage-border bg-kage-yoru/80 hover:border-kage-border-light transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm font-bold text-kage-gold bg-kage-gold/10 px-2.5 py-1 rounded border border-kage-gold/20 tracking-wider">
                              {v.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(v.code)}
                              className="text-kage-mist-dim hover:text-kage-gold p-1 transition"
                              title="Salin Kode Voucher"
                            >
                              {copiedCode === v.code ? (
                                <Check className="w-3.5 h-3.5 text-kage-success" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                                active
                                  ? 'bg-kage-success/10 text-kage-success border-kage-success/30'
                                  : 'bg-kage-mist-dim/10 text-kage-mist-dim border-kage-border'
                              }`}
                            >
                              {active ? 'Aktif' : 'Kedaluwarsa'}
                            </span>
                          </div>

                          <p className="text-xs text-kage-washi font-medium pt-1">
                            Diskon:{' '}
                            <strong className="text-kage-vermilion">
                              {v.discount_type === 'PERCENT'
                                ? `${v.discount_value}%`
                                : formatRupiah(v.discount_value)}
                            </strong>
                          </p>

                          <div className="text-[11px] text-kage-mist-dim flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Berlaku s/d:{' '}
                              {new Date(v.end_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span>&bull;</span>
                            <span>Digunakan: {v.used_count || 0}x</span>
                          </div>
                        </div>

                        <div className="text-right sm:text-right w-full sm:w-auto">
                          <span className="text-[11px] font-mono text-kage-mist-dim block">
                            Dibuat:{' '}
                            {new Date(v.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
