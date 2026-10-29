'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { EventDetail, TicketType } from '@/types/event';
import { formatRupiah, formatDateTime, formatDate, getImageUrl } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import EventQAWall from '@/components/event/EventQAWall';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Ticket,
  Shield,
  Loader2,
  ArrowRight,
  Edit3,
  TicketPercent,
  Sparkles,
  Bookmark,
  Users,
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketSelections, setTicketSelections] = useState<{ [tierId: string]: number }>({});
  const [validatingStock, setValidatingStock] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const MAX_TOTAL_TICKETS = 5;

  useEffect(() => {
    async function loadEventDetail() {
      try {
        setLoading(true);
        const res = await api.get(`/events/${eventId}`);
        if (res.data?.data) {
          setEvent(res.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load event detail:', err);
        setToast({ message: 'Event tidak ditemukan atau gagal dimuat.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    async function checkWishlist() {
      try {
        const res = await api.get(`/wishlists/${eventId}/check`);
        if (res.data?.data) {
          setIsWishlisted(res.data.data.is_wishlisted);
        }
      } catch {
        // user might not be logged in
      }
    }

    if (eventId) {
      loadEventDetail();
      checkWishlist();
    }
  }, [eventId]);

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isUpdatingWishlist) return;

    try {
      setIsUpdatingWishlist(true);
      if (isWishlisted) {
        await api.delete(`/wishlists/${eventId}`);
        setIsWishlisted(false);
        setToast({ message: 'Event dihapus dari wishlist.', type: 'success' });
      } else {
        await api.post(`/wishlists/${eventId}`);
        setIsWishlisted(true);
        setToast({ message: 'Event berhasil disimpan ke wishlist!', type: 'success' });
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Gagal mengubah status wishlist.',
        type: 'error',
      });
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  const totalSelectedTickets = Object.values(ticketSelections).reduce((a, b) => a + b, 0);

  const handleUpdateQty = (tierId: string, delta: number, availableQuota: number) => {
    const current = ticketSelections[tierId] || 0;
    const next = current + delta;

    if (next < 0) return;
    if (delta > 0) {
      if (totalSelectedTickets >= MAX_TOTAL_TICKETS) {
        setToast({
          message: `Maksimal pembelian adalah ${MAX_TOTAL_TICKETS} tiket per transaksi.`,
          type: 'error',
        });
        return;
      }
      if (next > availableQuota) {
        setToast({
          message: `Sisa kuota untuk tiket ini hanya tersisa ${availableQuota}.`,
          type: 'error',
        });
        return;
      }
    }

    setTicketSelections((prev) => ({
      ...prev,
      [tierId]: next,
    }));
  };

  const calculateSubtotal = () => {
    if (!event) return 0;
    return event.ticket_types.reduce((acc, t) => {
      const qty = ticketSelections[t.id] || 0;
      return acc + qty * t.price;
    }, 0);
  };

  const handleProceedToCheckout = async () => {
    if (totalSelectedTickets === 0) {
      setToast({ message: 'Pilih minimal 1 tiket untuk melanjutkan.', type: 'error' });
      return;
    }

    const selectedTierEntry = Object.entries(ticketSelections).find(([_, qty]) => qty > 0);
    if (!selectedTierEntry) return;

    const [tierId, qty] = selectedTierEntry;

    try {
      setValidatingStock(true);
      // Validasi ketersediaan kuota tiket real-time ke API Backend
      const res = await api.get(`/events/tickets/${tierId}/availability?qty=${qty}`);

      if (res.data?.success) {
        setToast({
          message: 'Kuota tiket valid! Mengalihkan ke ringkasan pesanan...',
          type: 'success',
        });

        setTimeout(() => {
          router.push(`/checkout/${eventId}?tierId=${tierId}&qty=${qty}`);
        }, 800);
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message || 'Maaf, kuota tiket tidak lagi mencukupi.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setValidatingStock(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Memuat detail sinema...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-kage-washi">Event Tidak Ditemukan</h2>
        <p className="text-xs text-kage-mist">Event yang Anda cari mungkin telah berakhir.</p>
      </div>
    );
  }

  const organizerUserId = event.organizer?.id || (event as any).organizer_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── ORGANIZER QUICK CONTROLS ───────────────────── */}
      {user?.role === 'ORGANIZER' && (user?.id === organizerUserId) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-kage-gold/10 border border-kage-gold/30 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 text-xs text-kage-gold font-medium">
            <Sparkles className="w-4 h-4 text-kage-gold flex-shrink-0" />
            <span>Panel Penyelenggara: Anda adalah pemilik acara ini</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href={`/organizer/events/${event.id}/edit`}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-kage-gold hover:bg-yellow-500 text-kage-black flex items-center gap-1.5 transition shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </Link>
            <Link
              href={`/organizer/events/${event.id}/vouchers`}
              className="px-3.5 py-1.5 rounded text-xs font-semibold border border-kage-gold text-kage-gold hover:bg-kage-gold/10 flex items-center gap-1.5 transition"
            >
              <TicketPercent className="w-3.5 h-3.5" />
              <span>Kelola Voucher</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── 1. BANNER & HEADER ──────────────────────────── */}
      <div className="space-y-6">
        <div className="relative aspect-[21/9] sm:aspect-[21/8] w-full rounded-lg overflow-hidden bg-kage-black border border-kage-border shadow-2xl">
          <img
            src={getImageUrl(event.banner_url)}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-kage-black via-kage-black/40 to-transparent" />

          {/* Bookmark Button (Top Right of Banner) */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={isUpdatingWishlist}
            title={isWishlisted ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
            className={`absolute top-4 right-4 z-20 px-3.5 py-2 rounded-full flex items-center gap-2 backdrop-blur-md border text-xs font-medium transition-all shadow-lg ${
              isWishlisted
                ? 'bg-kage-gold text-kage-black border-kage-gold font-semibold shadow-kage-gold/20'
                : 'bg-kage-black/70 text-kage-mist border-kage-border hover:border-kage-gold hover:text-kage-gold'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isWishlisted ? 'fill-kage-black' : ''}`} />
            <span>{isWishlisted ? 'Tersimpan di Wishlist' : 'Simpan ke Wishlist'}</span>
          </button>

          {/* Badge & Category Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded bg-kage-red/90 text-white font-semibold text-xs uppercase tracking-wider shadow">
                {event.category?.name}
              </span>
              <h1 className="font-serif text-2xl sm:text-4xl text-kage-washi font-normal leading-tight">
                {event.title}
              </h1>
            </div>

            {event.review_stats && event.review_stats.total_reviews > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-kage-yoru/80 backdrop-blur-md border border-kage-border">
                <Star className="w-4 h-4 text-kage-gold fill-kage-gold" />
                <span className="text-xs font-semibold text-kage-washi">
                  {event.review_stats.average_rating}
                </span>
                <span className="text-[11px] text-kage-mist-dim">
                  ({event.review_stats.total_reviews} ulasan)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. TWO-COLUMN LAYOUT: CONTENT & TICKET BOX ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Details & Reviews (8 Cols) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Metadata Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-lg bg-kage-yoru border border-kage-border">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-kage-gold shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-kage-mist-dim block">
                  Jadwal Penayangan
                </span>
                <p className="text-xs font-medium text-kage-washi mt-0.5">
                  {formatDate(event.start_date)} — {formatDate(event.end_date)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-kage-gold shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase tracking-wider text-kage-mist-dim block">
                  Lokasi &amp; Hall
                </span>
                <p className="text-xs font-medium text-kage-washi mt-0.5">
                  {event.location}, {event.city}
                </p>
              </div>
            </div>
          </div>

          {/* Sinopsis / Deskripsi */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl text-kage-washi font-medium border-b border-kage-border pb-2">
              Sinopsis &amp; Deskripsi Event
            </h3>
            <div className="text-xs sm:text-sm text-kage-mist leading-relaxed whitespace-pre-line font-sans space-y-3">
              <p>{event.description}</p>
            </div>
          </div>

          {/* Organizer Profile Card */}
          <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-kage-gold font-semibold block">
                Penyelenggara / Organizer
              </span>
              {organizerUserId && (
                <Link
                  href={`/organizer/${organizerUserId}`}
                  className="text-xs text-kage-gold hover:underline flex items-center gap-1"
                >
                  Lihat Profil Lengkap →
                </Link>
              )}
            </div>

            <div className="flex items-start gap-4">
              <Link
                href={organizerUserId ? `/organizer/${organizerUserId}` : '#'}
                className="w-12 h-12 rounded-full bg-kage-yoru-light border border-kage-border flex items-center justify-center overflow-hidden shrink-0 hover:border-kage-gold transition"
              >
                {event.organizer.profile_picture ? (
                  <img
                    src={getImageUrl(event.organizer.profile_picture)}
                    alt={event.organizer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-base text-kage-gold font-bold">
                    {event.organizer.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
              <div className="space-y-1">
                <Link
                  href={organizerUserId ? `/organizer/${organizerUserId}` : '#'}
                  className="font-serif text-base text-kage-washi font-medium hover:text-kage-gold transition"
                >
                  {event.organizer.organizer_profile?.organization_name || event.organizer.name}
                </Link>
                <p className="text-xs text-kage-mist leading-relaxed">
                  {event.organizer.organizer_profile?.bio ||
                    'Kolektif independen pemutaran film sinema dan pertunjukan interaktif.'}
                </p>
                {event.organizer._count && (
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-kage-mist-dim font-sans">
                    <span>{event.organizer._count.following || 0} Pengikut</span>
                    <span>•</span>
                    <span>{event.organizer._count.events || 0} Acara</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ulasan Penonton */}
          {event.reviews && event.reviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-kage-washi font-medium border-b border-kage-border pb-2">
                Ulasan Penonton ({event.reviews.length})
              </h3>
              <div className="space-y-3">
                {event.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded bg-kage-yoru border border-kage-border/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-kage-washi">
                        {rev.customer?.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating
                                ? 'text-kage-gold fill-kage-gold'
                                : 'text-kage-border'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-kage-mist leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CARD DAY 18: Q&A DISCUSSION WALL FORUM ───── */}
          <EventQAWall eventId={event.id} organizerId={organizerUserId} />
        </div>

        {/* Right Column: Sticky Ticket Box (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 rounded-lg bg-kage-yoru border border-kage-border p-6 shadow-2xl space-y-6">
            <div className="border-b border-kage-border pb-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-kage-gold uppercase tracking-wider">
                <Ticket className="w-4 h-4" />
                <span>Pilih Tiket Sinema</span>
              </div>
              <p className="text-xs text-kage-mist">
                Pilih jenis tiket dan jumlah kursi Anda.
              </p>
            </div>

            {/* Ticket Tier List */}
            <div className="space-y-4">
              {event.ticket_types && event.ticket_types.length > 0 ? (
                event.ticket_types.map((ticket) => {
                  const qty = ticketSelections[ticket.id] || 0;
                  const isSoldOut = ticket.available_quota <= 0;

                  return (
                    <div
                      key={ticket.id}
                      className={`p-3.5 rounded border transition space-y-3 ${
                        qty > 0
                          ? 'border-kage-gold/60 bg-kage-yoru-light/80'
                          : isSoldOut
                          ? 'border-kage-border/40 opacity-60 bg-kage-black/40'
                          : 'border-kage-border bg-kage-yoru-light'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-kage-washi">
                            {ticket.name}
                          </h4>
                          <span className="text-xs font-bold text-kage-gold font-sans mt-0.5 block">
                            {formatRupiah(ticket.price)}
                          </span>
                        </div>

                        {isSoldOut ? (
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-kage-error/20 text-kage-error border border-kage-error/30">
                            Habis Terjual
                          </span>
                        ) : (
                          <span className="text-[10px] text-kage-mist-dim">
                            Sisa: {ticket.available_quota} kursi
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      {!isSoldOut && (
                        <div className="flex items-center justify-between pt-2 border-t border-kage-border/50">
                          <span className="text-[11px] text-kage-mist">Jumlah:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQty(ticket.id, -1, ticket.available_quota)
                              }
                              disabled={qty <= 0}
                              className="w-6 h-6 rounded bg-kage-yoru border border-kage-border flex items-center justify-center text-kage-mist hover:text-kage-washi disabled:opacity-40 transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-kage-washi">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQty(ticket.id, 1, ticket.available_quota)
                              }
                              disabled={
                                qty >= ticket.available_quota ||
                                totalSelectedTickets >= MAX_TOTAL_TICKETS
                              }
                              className="w-6 h-6 rounded bg-kage-yoru border border-kage-border flex items-center justify-center text-kage-mist hover:text-kage-washi disabled:opacity-40 transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-kage-mist">Tiket belum tersedia untuk event ini.</p>
              )}
            </div>

            {/* Subtotal & Checkout CTA */}
            <div className="border-t border-kage-border pt-4 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-kage-mist">Total ({totalSelectedTickets} tiket):</span>
                <span className="text-base font-bold text-kage-gold font-sans">
                  {formatRupiah(calculateSubtotal())}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={totalSelectedTickets === 0 || validatingStock}
                className="w-full py-3 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white text-xs font-semibold tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg"
              >
                {validatingStock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memvalidasi Kuota...</span>
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Pembayaran</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-kage-mist-dim">
                <Shield className="w-3 h-3 text-kage-success" />
                <span>Pemesanan dienkripsi &amp; tiket dikirim instan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
