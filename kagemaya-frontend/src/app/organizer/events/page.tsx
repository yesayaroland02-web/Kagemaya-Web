'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { formatRupiah, getImageUrl } from '@/lib/utils';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Edit3, 
  TicketPercent, 
  ExternalLink, 
  Loader2, 
  Trash2, 
  ShieldAlert, 
  Layers, 
  Clock, 
  FileEdit,
  Sparkles,
  Ticket
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  banner_url?: string | null;
  city: string;
  location: string;
  start_date?: string;
  end_date?: string;
  available_seats: number;
  starting_price?: number;
  status: 'PUBLISHED' | 'DRAFT';
  is_local_draft?: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  ticket_types?: Array<{
    id: string;
    name: string;
    price: number;
    quota: number;
    available_quota: number;
  }>;
  vouchers?: Array<any>;
}

export default function MyOrganizerEventsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Load events from API & LocalStorage
  const loadOrganizerEvents = async () => {
    try {
      setLoading(true);

      // 1. Fetch published events from API
      let apiEvents: EventItem[] = [];
      try {
        const res = await api.get('/events/organizer/my-events');
        if (res.data?.data && Array.isArray(res.data.data)) {
          apiEvents = res.data.data.map((e: any) => ({
            ...e,
            status: 'PUBLISHED',
          }));
        }
      } catch (err) {
        console.warn('Gagal memuat event dari API:', err);
      }

      // 2. Fetch local draft from LocalStorage (if any)
      const draftList: EventItem[] = [];
      try {
        const localDraftStr = localStorage.getItem('kagemaya_event_create_draft');
        if (localDraftStr) {
          const d = JSON.parse(localDraftStr);
          const totalSeats = d.tickets?.reduce(
            (sum: number, t: any) => sum + (Number(t.quota) || 0),
            0
          ) || 0;
          const minPrice = d.tickets && d.tickets.length > 0
            ? Math.min(...d.tickets.map((t: any) => Number(t.price) || 0))
            : 0;

          draftList.push({
            id: 'local-draft',
            title: d.title || 'Draf Event Tanpa Judul',
            description: d.description || 'Draf formulir tersimpan di peramban Anda.',
            banner_url: null,
            city: d.city || 'Belum Ditentukan',
            location: d.location || 'Lokasi Belum Diisi',
            start_date: d.startDate || undefined,
            end_date: d.endDate || undefined,
            available_seats: totalSeats,
            starting_price: minPrice,
            status: 'DRAFT',
            is_local_draft: true,
            category: {
              id: d.categoryId || 'cat-draft',
              name: 'Draf Kategori',
              slug: 'draft',
            },
            ticket_types: d.tickets || [],
          });
        }
      } catch (err) {
        console.warn('Gagal membaca draf lokal:', err);
      }

      // Combine both
      setEvents([...draftList, ...apiEvents]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'ORGANIZER') {
      loadOrganizerEvents();
    }
  }, [authLoading, user]);

  // Handle Remove Local Draft
  const handleRemoveDraft = () => {
    if (confirm('Apakah Anda yakin ingin menghapus draf event ini?')) {
      localStorage.removeItem('kagemaya_event_create_draft');
      setEvents((prev) => prev.filter((e) => !e.is_local_draft));
    }
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    if (filterTab === 'ALL') return true;
    return e.status === filterTab;
  });

  const totalPublished = events.filter((e) => e.status === 'PUBLISHED').length;
  const totalDraft = events.filter((e) => e.status === 'DRAFT').length;
  const totalSeats = events.reduce((sum, e) => sum + (e.available_seats || 0), 0);

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
          Daftar kelola event hanya dapat diakses oleh akun dengan peran <strong>ORGANIZER</strong>.
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

        {/* TOP HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-kage-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-kage-gold font-semibold bg-kage-gold/10 px-2 py-0.5 rounded border border-kage-gold/20">
                Portal Organizer
              </span>
              <span className="text-xs text-kage-mist-dim font-serif">主催イベント · Event Saya</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-kage-washi mt-1">
              Event Saya (My Events)
            </h1>
            <p className="text-xs text-kage-mist-dim mt-1">
              Kelola status publikasi, tiket, voucher promo, dan pembaruan acara Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organizer/events/create"
              className="px-5 py-2.5 rounded text-xs font-semibold bg-kage-red hover:bg-kage-vermilion text-white shadow-md flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Event Baru</span>
            </Link>
          </div>
        </div>

        {/* METRICS OVERVIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-kage-black/60 border border-kage-border">
            <span className="text-xs text-kage-mist-dim block">Total Event</span>
            <span className="font-serif text-2xl font-bold text-kage-washi mt-1 block">
              {events.length}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-kage-black/60 border border-kage-border">
            <span className="text-xs text-kage-success block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-kage-success" />
              Dipublikasikan
            </span>
            <span className="font-serif text-2xl font-bold text-kage-success mt-1 block">
              {totalPublished}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-kage-black/60 border border-kage-border">
            <span className="text-xs text-kage-gold block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-kage-gold" />
              Draf Tersimpan
            </span>
            <span className="font-serif text-2xl font-bold text-kage-gold mt-1 block">
              {totalDraft}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-kage-black/60 border border-kage-border">
            <span className="text-xs text-kage-mist-dim block">Total Kursi Terbuka</span>
            <span className="font-serif text-2xl font-bold text-kage-gold mt-1 block">
              {totalSeats}
            </span>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex items-center gap-2 pb-4 mb-6 border-b border-kage-border">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-4 py-2 rounded text-xs font-medium transition ${
              filterTab === 'ALL'
                ? 'bg-kage-gold text-kage-black font-semibold shadow-sm'
                : 'text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light'
            }`}
          >
            Semua Event ({events.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('PUBLISHED')}
            className={`px-4 py-2 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              filterTab === 'PUBLISHED'
                ? 'bg-kage-success text-kage-black font-semibold shadow-sm'
                : 'text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>PUBLISH ({totalPublished})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('DRAFT')}
            className={`px-4 py-2 rounded text-xs font-medium transition flex items-center gap-1.5 ${
              filterTab === 'DRAFT'
                ? 'bg-kage-gold text-kage-black font-semibold shadow-sm'
                : 'text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>DRAFT ({totalDraft})</span>
          </button>
        </div>

        {/* EVENT LIST CONTENT */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-kage-mist">
            <Loader2 className="w-8 h-8 text-kage-gold animate-spin mb-3" />
            <p className="text-sm font-serif">Memuat daftar event Anda...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-kage-border rounded-lg bg-kage-black/30">
            <Ticket className="w-12 h-12 text-kage-mist-dim mx-auto mb-3 opacity-40" />
            <h3 className="font-serif text-lg font-medium text-kage-washi">
              Tidak Ada Event Ditemukan
            </h3>
            <p className="text-xs text-kage-mist-dim mt-1 max-w-sm mx-auto">
              {filterTab === 'DRAFT'
                ? 'Tidak ada draf event tersimpan saat ini.'
                : 'Anda belum memiliki event terdaftar. Mulai buat karya sinematik Anda sekarang.'}
            </p>
            <Link
              href="/organizer/events/create"
              className="inline-flex items-center gap-1.5 mt-5 px-5 py-2 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Event Baru</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-lg border border-kage-border bg-kage-black/60 hover:border-kage-border-light transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-24 h-16 sm:w-28 sm:h-20 rounded bg-kage-yoru-light border border-kage-border overflow-hidden flex-shrink-0 relative">
                    {item.banner_url ? (
                      <img
                        src={getImageUrl(item.banner_url)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-kage-gold">
                        <Sparkles className="w-6 h-6 opacity-60" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* STATUS BADGE */}
                      {item.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-kage-success/10 text-kage-success border border-kage-success/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-kage-success animate-pulse" />
                          PUBLISH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-kage-gold/10 text-kage-gold border border-kage-gold/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-kage-gold" />
                          DRAFT
                        </span>
                      )}

                      {item.category && (
                        <span className="text-[11px] text-kage-mist-dim border-l border-kage-border pl-2">
                          {item.category.name}
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif text-base sm:text-lg font-medium text-kage-washi truncate">
                      {item.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-kage-mist-dim">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-kage-gold" />
                        <span>{item.city}</span>
                      </span>

                      {item.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-kage-gold" />
                          <span>
                            {new Date(item.start_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-kage-gold" />
                        <span>{item.available_seats} Kursi</span>
                      </span>

                      {item.starting_price !== undefined && item.starting_price > 0 && (
                        <span className="text-kage-vermilion font-medium">
                          Mulai {formatRupiah(item.starting_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-kage-border">
                  {item.status === 'PUBLISHED' ? (
                    <>
                      <Link
                        href={`/events/${item.id}`}
                        className="p-2 rounded border border-kage-border hover:border-kage-gold text-kage-mist hover:text-kage-washi text-xs transition"
                        title="Lihat Detail Acara"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <Link
                        href={`/organizer/events/${item.id}/vouchers`}
                        className="px-3 py-1.5 rounded border border-kage-border hover:border-kage-gold text-kage-gold hover:bg-kage-gold/10 text-xs font-medium flex items-center gap-1.5 transition"
                        title="Kelola Voucher Promo"
                      >
                        <TicketPercent className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Voucher</span>
                      </Link>

                      <Link
                        href={`/organizer/events/${item.id}/edit`}
                        className="px-3.5 py-1.5 rounded bg-kage-gold hover:bg-yellow-500 text-kage-black text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        title="Edit Event"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Event</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleRemoveDraft}
                        className="p-2 rounded border border-kage-border hover:border-kage-vermilion text-kage-mist-dim hover:text-kage-vermilion text-xs transition"
                        title="Hapus Draf"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Link
                        href="/organizer/events/create"
                        className="px-4 py-1.5 rounded bg-kage-gold hover:bg-yellow-500 text-kage-black text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Lanjutkan & Terbitkan</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
