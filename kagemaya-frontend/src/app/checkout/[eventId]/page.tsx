'use client';

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Gift,
  Loader2,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  TicketPercent,
  XCircle,
} from 'lucide-react';
import { EventDetail, EventVoucher, TicketType } from '@/types/event';
import React, { useEffect, useMemo, useState } from 'react';
import { formatDate, formatRupiah, getImageUrl } from '@/lib/utils';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import Link from 'next/link';
import Toast from '@/components/ui/Toast';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

interface UserCoupon {
  id: string;
  discount_amount: number;
  expires_at: string;
  is_used: boolean;
}

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const initialTierId = searchParams.get('tierId');
  const initialQty = parseInt(searchParams.get('qty') || '1', 10);

  const { user, isLoading: authLoading } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Pilihan Tiket
  const [selectedTierId, setSelectedTierId] = useState<string>(initialTierId || '');
  const [quantity, setQuantity] = useState<number>(initialQty > 0 ? initialQty : 1);

  // Voucher Organizer
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount_type: 'PERCENT' | 'FIXED';
    discount_value: number;
    discount_amount: number;
  } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Kupon Referral User
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');

  // Poin Kagemaya
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [usePointsToggle, setUsePointsToggle] = useState<boolean>(false);
  const [pointsToUse, setPointsToUse] = useState<number>(0);

  // 1. Redirect jika belum login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/checkout/${eventId}`);
    }
  }, [user, authLoading, router, eventId]);

  // 2. Load Event Detail & User Rewards
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [eventRes, pointsRes, couponsRes] = await Promise.allSettled([
          api.get(`/events/${eventId}`),
          api.get('/me/points'),
          api.get('/me/coupons'),
        ]);

        if (eventRes.status === 'fulfilled' && eventRes.value.data?.data) {
          const evt: EventDetail = eventRes.value.data.data;
          setEvent(evt);

          // Jika tier belum dipilih, pilih tier pertama yang tersedia
          if (!initialTierId && evt.ticket_types && evt.ticket_types.length > 0) {
            const firstAvailable = evt.ticket_types.find((t) => t.available_quota > 0);
            if (firstAvailable) setSelectedTierId(firstAvailable.id);
          }
        } else {
          setToast({ message: 'Gagal memuat informasi event.', type: 'error' });
        }

        if (pointsRes.status === 'fulfilled' && pointsRes.value.data?.data) {
          setPointBalance(pointsRes.value.data.data.balance || 0);
        }

        if (couponsRes.status === 'fulfilled' && couponsRes.value.data?.data) {
          setUserCoupons(couponsRes.value.data.data || []);
        }
      } catch (err: any) {
        console.error('Checkout load data error:', err);
        setToast({ message: 'Terjadi kesalahan saat memuat data checkout.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadData();
    }
  }, [eventId, initialTierId]);

  // Tiket yang sedang dipilih
  const currentTicket: TicketType | undefined = useMemo(() => {
    return event?.ticket_types.find((t) => t.id === selectedTierId);
  }, [event, selectedTierId]);

  // 3. CALCULATION ENGINE LOGIC
  // Total Bayar = (Harga Tiket - Diskon Voucher - Diskon Kupon) - Poin
  const calculations = useMemo(() => {
    const unitPrice = currentTicket?.price || 0;
    const subtotal = unitPrice * quantity;

    // Diskon Voucher
    let voucherDiscount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.discount_type === 'PERCENT') {
        voucherDiscount = Math.floor((subtotal * appliedVoucher.discount_value) / 100);
      } else {
        voucherDiscount = appliedVoucher.discount_value;
      }
      voucherDiscount = Math.min(voucherDiscount, subtotal);
    }

    // Diskon Kupon
    let couponDiscount = 0;
    const remainingAfterVoucher = Math.max(0, subtotal - voucherDiscount);
    if (selectedCouponId) {
      const coupon = userCoupons.find((c) => c.id === selectedCouponId);
      if (coupon) {
        couponDiscount = Math.min(coupon.discount_amount, remainingAfterVoucher);
      }
    }

    // Potongan Poin
    const remainingAfterCoupon = Math.max(0, remainingAfterVoucher - couponDiscount);
    let finalPointsDiscount = 0;
    if (usePointsToggle && pointsToUse > 0) {
      finalPointsDiscount = Math.min(pointsToUse, remainingAfterCoupon, pointBalance);
    }

    // Total Akhir
    const finalPrice = Math.max(0, remainingAfterCoupon - finalPointsDiscount);

    return {
      subtotal,
      voucherDiscount,
      couponDiscount,
      pointsDiscount: finalPointsDiscount,
      finalPrice,
    };
  }, [currentTicket, quantity, appliedVoucher, selectedCouponId, usePointsToggle, pointsToUse, pointBalance, userCoupons]);

  // Sesuaikan nilai poin saat toggle dinyalakan
  useEffect(() => {
    if (usePointsToggle) {
      const remainingForPoints = Math.max(0, calculations.subtotal - calculations.voucherDiscount - calculations.couponDiscount);
      const optimalPoints = Math.min(pointBalance, remainingForPoints);
      setPointsToUse(optimalPoints);
    } else {
      setPointsToUse(0);
    }
  }, [usePointsToggle, calculations.subtotal, calculations.voucherDiscount, calculations.couponDiscount, pointBalance]);

  // Salin Kode Voucher
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setToast({ message: `Kode voucher "${code}" berhasil disalin!`, type: 'info' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Validasi Voucher Organizer ke backend
  const handleApplyVoucher = async (codeOverride?: string) => {
    const targetCode = (codeOverride || voucherCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setVoucherError('Masukkan kode voucher.');
      return;
    }

    if (codeOverride) {
      setVoucherCodeInput(targetCode);
    }git 

    try {
      setCheckingVoucher(true);
      setVoucherError(null);

      // Gunakan endpoint calculate untuk dry-run validasi voucher
      const res = await api.post('/transactions/calculate', {
        event_id: eventId,
        items: [{ ticket_type_id: selectedTierId, quantity }],
        voucher_code: targetCode,
      });

      if (res.data?.success && res.data.data.applied_voucher) {
        setAppliedVoucher(res.data.data.applied_voucher);
        setToast({ message: `Voucher "${targetCode}" berhasil diterapkan!`, type: 'success' });
      } else {
        setVoucherError('Voucher tidak dapat diterapkan pada pesanan ini.');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Kode voucher tidak valid atau kedaluwarsa.';
      setVoucherError(errMsg);
      setAppliedVoucher(null);
    } finally {
      setCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
    setVoucherError(null);
  };

  // Submit Transaksi
  const handleCheckoutSubmit = async () => {
    if (!currentTicket) {
      setToast({ message: 'Pilih jenis tiket terlebih dahulu.', type: 'error' });
      return;
    }

    if (quantity <= 0) {
      setToast({ message: 'Jumlah tiket minimal 1.', type: 'error' });
      return;
    }

    if (quantity > currentTicket.available_quota) {
      setToast({ message: `Sisa tiket hanya tersedia ${currentTicket.available_quota}.`, type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        event_id: eventId,
        items: [
          {
            ticket_type_id: selectedTierId,
            quantity,
          },
        ],
        voucher_code: appliedVoucher ? appliedVoucher.code : undefined,
        coupon_id: selectedCouponId || undefined,
        points_used: usePointsToggle ? calculations.pointsDiscount : 0,
      };

      const res = await api.post('/transactions', payload);

      if (res.data?.success && res.data?.data) {
        const transactionId = res.data.data.id;
        setToast({
          message: 'Pemesanan berhasil dibuat! Mengalihkan ke pembayaran...',
          type: 'success',
        });

        setTimeout(() => {
          router.push(`/transactions/${transactionId}/pay`);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Checkout submit error details:', err.response?.data || err.message || err);
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401 ? 'Sesi Anda telah berakhir. Silakan login kembali.' : null) ||
        err.message ||
        'Terjadi kesalahan saat memproses checkout.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Menyiapkan lembar checkout...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-kage-washi">Event Tidak Ditemukan</h2>
        <Link href="/" className="text-xs text-kage-gold hover:underline">
          Kembali ke Beranda
        </Link>
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

      {/* Header Breadcrumb */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[11px] text-kage-mist-dim uppercase tracking-wider">
          <Link href={`/events/${eventId}`} className="hover:text-kage-gold transition">
            Detail Event
          </Link>
          <span>/</span>
          <span className="text-kage-gold">Checkout & Pembayaran</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl text-kage-washi font-medium">
          Konfirmasi Pemesanan Tiket
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* KOLOM KIRI (7 Cols): Summary Pilihan Tiket & Diskon */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Event Summary */}
          <div className="p-5 rounded-lg bg-kage-yoru border border-kage-border flex gap-4 items-center">
            <div className="w-20 h-24 rounded overflow-hidden bg-kage-black shrink-0 border border-kage-border">
              <img
                src={getImageUrl(event.banner_url)}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5 overflow-hidden">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-kage-red/80 text-white uppercase tracking-wider">
                {event.category?.name}
              </span>
              <h2 className="font-serif text-base text-kage-washi truncate font-medium">
                {event.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-kage-mist-dim">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-kage-gold" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-kage-gold" />
                  <span className="truncate">{event.location}, {event.city}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pilihan Tiket & Jumlah */}
          <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-kage-gold uppercase tracking-wider border-b border-kage-border pb-3">
              <Ticket className="w-4 h-4" />
              <span>Detail Tiket Dipilih</span>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-kage-mist block">Pilih Kategori Tiket:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.ticket_types.map((ticket) => {
                  const isSelected = ticket.id === selectedTierId;
                  const isSoldOut = ticket.available_quota <= 0;

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        setSelectedTierId(ticket.id);
                        if (quantity > ticket.available_quota) {
                          setQuantity(ticket.available_quota);
                        }
                      }}
                      className={`p-3 rounded text-left border transition ${
                        isSelected
                          ? 'border-kage-gold bg-kage-gold/10'
                          : isSoldOut
                          ? 'border-kage-border/40 opacity-50 cursor-not-allowed bg-kage-black/40'
                          : 'border-kage-border bg-kage-yoru-light hover:border-kage-mist-dim'
                      }`}
                    >
                      <div className="text-xs font-medium text-kage-washi">{ticket.name}</div>
                      <div className="text-xs font-bold text-kage-gold mt-1 font-sans">
                        {formatRupiah(ticket.price)}
                      </div>
                      <div className="text-[10px] text-kage-mist-dim mt-0.5">
                        {isSoldOut ? 'Habis Terjual' : `Sisa ${ticket.available_quota} kursi`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Jumlah Tiket */}
            {currentTicket && (
              <div className="flex items-center justify-between pt-4 border-t border-kage-border/50">
                <div>
                  <span className="text-xs text-kage-washi font-medium block">Jumlah Tiket:</span>
                  <span className="text-[11px] text-kage-mist-dim">
                    Maks. 5 tiket per pesanan
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded bg-kage-yoru-light border border-kage-border flex items-center justify-center text-kage-mist hover:text-kage-washi disabled:opacity-40 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-kage-washi font-sans">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(5, currentTicket.available_quota, q + 1)
                      )
                    }
                    disabled={quantity >= 5 || quantity >= currentTicket.available_quota}
                    className="w-7 h-7 rounded bg-kage-yoru-light border border-kage-border flex items-center justify-center text-kage-mist hover:text-kage-washi disabled:opacity-40 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Diskon Voucher & Kupon Referral */}
          <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-kage-gold uppercase tracking-wider border-b border-kage-border pb-3">
              <Tag className="w-4 h-4" />
              <span>Voucher Organizer & Kupon Referral</span>
            </div>

            {/* 1. SECTION VOUCHER PENYELENGGARA TERSEDIA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-kage-washi font-medium flex items-center gap-1.5">
                  <TicketPercent className="w-4 h-4 text-kage-gold" />
                  <span>Voucher Tersedia dari Penyelenggara:</span>
                </label>
                {event.vouchers && event.vouchers.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-kage-gold/10 border border-kage-gold/20 text-kage-gold font-medium">
                    {event.vouchers.length} Tersedia
                  </span>
                )}
              </div>

              {event.vouchers && event.vouchers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.vouchers.map((v) => {
                    const isApplied = appliedVoucher?.code?.toUpperCase() === v.code.toUpperCase();
                    const isUpcoming = new Date(v.start_date) > new Date();
                    const isApplyingThis = checkingVoucher && voucherCodeInput === v.code.toUpperCase();

                    // Perhitungan estimasi diskon
                    const estimatedDiscount =
                      v.discount_type === 'PERCENT'
                        ? Math.floor((calculations.subtotal * v.discount_value) / 100)
                        : Math.min(v.discount_value, calculations.subtotal);

                    return (
                      <div
                        key={v.id}
                        className={`relative rounded-lg p-3.5 border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                          isApplied
                            ? 'bg-kage-gold/10 border-kage-gold shadow-md shadow-kage-gold/5 ring-1 ring-kage-gold/40'
                            : isUpcoming
                            ? 'bg-kage-yoru-light/40 border-kage-border/50 opacity-60'
                            : 'bg-kage-yoru-light/90 border-kage-border hover:border-kage-gold/50 hover:bg-kage-yoru-light'
                        }`}
                      >
                        {/* Aksen Tepi Tiket */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            {/* Nilai Diskon */}
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-kage-red/90 text-white uppercase tracking-wider">
                                {v.discount_type === 'PERCENT'
                                  ? `${v.discount_value}% OFF`
                                  : `POTONGAN ${formatRupiah(v.discount_value)}`}
                              </span>
                            </div>

                            {/* Estimasi Potongan */}
                            <p className="text-[11px] text-kage-mist leading-tight">
                              Hemat hingga{' '}
                              <strong className="text-kage-gold font-sans">
                                {formatRupiah(estimatedDiscount)}
                              </strong>
                            </p>
                          </div>

                          {/* Tombol Aksi Gunakan / Terpasang */}
                          <div>
                            {isApplied ? (
                              <button
                                type="button"
                                onClick={handleRemoveVoucher}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-kage-gold text-kage-black hover:bg-yellow-500 transition flex items-center gap-1 shadow-sm"
                                title="Klik untuk membatalkan penggunaan voucher"
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Terpasang</span>
                              </button>
                            ) : isUpcoming ? (
                              <span className="px-2 py-1 rounded text-[10px] bg-kage-border text-kage-mist-dim font-medium">
                                Segera Hadir
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={checkingVoucher}
                                onClick={() => handleApplyVoucher(v.code)}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-kage-yoru border border-kage-gold/70 text-kage-gold hover:bg-kage-gold hover:text-kage-black transition disabled:opacity-50 flex items-center gap-1"
                              >
                                {isApplyingThis ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <span>Gunakan</span>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Garis Pembatas Tiket Perforasi */}
                        <div className="my-2.5 border-t border-dashed border-kage-border/80" />

                        {/* Bagian Bawah: Kode Voucher & Periode */}
                        <div className="flex items-center justify-between text-[11px]">
                          {/* Kode Voucher dengan Salin */}
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-kage-black border border-kage-border text-kage-washi tracking-wide">
                              {v.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(v.code)}
                              className="p-1 text-kage-mist hover:text-kage-gold transition rounded hover:bg-kage-black/40"
                              title="Salin kode voucher"
                            >
                              {copiedCode === v.code ? (
                                <Check className="w-3.5 h-3.5 text-kage-success" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Masa Berlaku */}
                          <div className="flex items-center gap-1 text-[10px] text-kage-mist-dim font-sans">
                            <Clock className="w-3 h-3 text-kage-mist-dim" />
                            <span>
                              {isUpcoming
                                ? `Mulai ${formatDate(v.start_date)}`
                                : `s/d ${formatDate(v.end_date)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg border border-dashed border-kage-border/70 bg-kage-yoru-light/30 flex items-center gap-3 text-xs text-kage-mist-dim">
                  <Tag className="w-4 h-4 text-kage-mist-dim shrink-0" />
                  <span>
                    Belum ada voucher publik dari penyelenggara untuk event ini. Anda tetap dapat memasukkan kode promo manual di bawah jika memilikinya.
                  </span>
                </div>
              )}
            </div>

            {/* Form Input Manual Voucher Organizer */}
            <div className="space-y-2 pt-2 border-t border-kage-border/50">
              <label className="text-xs text-kage-mist flex items-center justify-between">
                <span>Punya kode voucher lain?</span>
                {appliedVoucher && (
                  <span className="text-kage-success text-[11px] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Aktif: {appliedVoucher.code} (-{formatRupiah(calculations.voucherDiscount)})
                  </span>
                )}
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: KAGEPROMO50"
                  disabled={appliedVoucher !== null}
                  className="flex-1 px-3 py-2 rounded bg-kage-yoru-light border border-kage-border text-xs text-kage-washi placeholder-kage-mist-dim focus:outline-none focus:border-kage-gold uppercase font-mono disabled:opacity-60"
                />
                {appliedVoucher ? (
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="px-3.5 py-2 rounded bg-kage-yoru-light border border-kage-error/40 text-kage-error text-xs hover:bg-kage-error/10 transition"
                  >
                    Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyVoucher()}
                    disabled={checkingVoucher || !voucherCodeInput.trim()}
                    className="px-4 py-2 rounded bg-kage-gold text-kage-black font-semibold text-xs hover:bg-yellow-500 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {checkingVoucher ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Terapkan'}
                  </button>
                )}
              </div>
              {voucherError && (
                <p className="text-[11px] text-kage-error flex items-center gap-1 mt-1">
                  <XCircle className="w-3 h-3" /> {voucherError}
                </p>
              )}
            </div>

            {/* Pilihan Kupon Referral User */}
            <div className="space-y-2 pt-2 border-t border-kage-border/50">
              <label className="text-xs text-kage-mist flex items-center justify-between">
                <span>Gunakan Kupon Referral Anda:</span>
                <span className="text-[11px] text-kage-mist-dim">
                  Tersedia: {userCoupons.length} kupon
                </span>
              </label>

              {userCoupons.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedCouponId}
                    onChange={(e) => setSelectedCouponId(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-kage-yoru-light border border-kage-border text-xs text-kage-washi focus:outline-none focus:border-kage-gold"
                  >
                    <option value="">-- Jangan Gunakan Kupon Referral --</option>
                    {userCoupons.map((coupon) => (
                      <option key={coupon.id} value={coupon.id}>
                        Diskon {formatRupiah(coupon.discount_amount)} (Berlaku s/d {formatDate(coupon.expires_at)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-kage-mist-dim italic">
                  Anda belum memiliki kupon referral aktif dari teman yang mendaftar.
                </p>
              )}
            </div>

            {/* Toggle Penggunaan Poin */}
            <div className="space-y-3 pt-3 border-t border-kage-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-kage-gold" />
                  <div>
                    <span className="text-xs font-semibold text-kage-washi block">
                      Gunakan Poin Kagemaya
                    </span>
                    <span className="text-[11px] text-kage-mist-dim">
                      Saldo aktif: <strong className="text-kage-gold">{pointBalance.toLocaleString('id-ID')} Poin</strong>
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePointsToggle}
                    disabled={pointBalance <= 0}
                    onChange={(e) => setUsePointsToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-kage-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-kage-gold"></div>
                </label>
              </div>

              {usePointsToggle && pointBalance > 0 && (
                <div className="p-3 rounded bg-kage-yoru-light border border-kage-gold/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-kage-mist">Poin yang diaplikasikan:</span>
                    <span className="font-bold text-kage-gold font-sans">
                      {calculations.pointsDiscount.toLocaleString('id-ID')} Poin (= {formatRupiah(calculations.pointsDiscount)})
                    </span>
                  </div>
                  <p className="text-[10px] text-kage-mist-dim leading-relaxed">
                    Sistem otomatis membatasi penggunaan poin agar tidak melebihi sisa total pembayaran Anda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (5 Cols): Calculation Engine Box & Checkout Action */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-kage-gold uppercase tracking-wider border-b border-kage-border pb-3">
              <Sparkles className="w-4 h-4" />
              <span>Ringkasan Pembayaran</span>
            </div>

            {/* Baris Rincian Biaya */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-kage-mist">
                <span>Harga Tiket ({quantity}x):</span>
                <span className="text-kage-washi font-medium font-sans">
                  {formatRupiah(calculations.subtotal)}
                </span>
              </div>

              {calculations.voucherDiscount > 0 && (
                <div className="flex justify-between items-center text-kage-success">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Diskon Voucher Organizer:
                  </span>
                  <span className="font-medium font-sans">
                    - {formatRupiah(calculations.voucherDiscount)}
                  </span>
                </div>
              )}

              {calculations.couponDiscount > 0 && (
                <div className="flex justify-between items-center text-kage-success">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Diskon Kupon Referral:
                  </span>
                  <span className="font-medium font-sans">
                    - {formatRupiah(calculations.couponDiscount)}
                  </span>
                </div>
              )}

              {calculations.pointsDiscount > 0 && (
                <div className="flex justify-between items-center text-kage-gold">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Potongan Poin:
                  </span>
                  <span className="font-medium font-sans">
                    - {formatRupiah(calculations.pointsDiscount)}
                  </span>
                </div>
              )}

              <div className="border-t border-kage-border pt-3 mt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-semibold text-kage-washi uppercase tracking-wider block">
                    Total Bayar:
                  </span>
                  <span className="text-[10px] text-kage-mist-dim">Sudah termasuk pajak & layanan</span>
                </div>
                <span className="font-serif text-2xl font-bold text-kage-gold">
                  {formatRupiah(calculations.finalPrice)}
                </span>
              </div>
            </div>

            {/* Tombol Buat Pesanan */}
            <button
              type="button"
              onClick={handleCheckoutSubmit}
              disabled={submitting || !currentTicket || quantity <= 0}
              className="w-full py-3.5 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-kage-red/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuat ID Transaksi...</span>
                </>
              ) : (
                <>
                  <span>Konfirmasi & Bayar Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Proteksi & Ketentuan */}
            <div className="pt-2 border-t border-kage-border/50 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-kage-mist-dim">
                <ShieldCheck className="w-4 h-4 text-kage-success shrink-0" />
                <span>Batas waktu pembayaran 2 jam dengan kunci kuota instan.</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-kage-mist-dim">
                <AlertCircle className="w-4 h-4 text-kage-gold shrink-0" />
                <span>Poin & kupon akan otomatis dikembalikan jika pesanan dibatalkan.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
