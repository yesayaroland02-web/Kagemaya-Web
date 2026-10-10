'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { EventItem, Category, PaginationMeta } from '@/types/event';
import EventCard from '@/components/event/EventCard';
import { Search, MapPin, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';

function EventsDiscoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialCity = searchParams.get('city') || '';
  const initialPage = Number(searchParams.get('page')) || 1;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search keyword
    }, 350);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get('/categories');
        if (res.data?.data) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch events on filter change
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (debouncedSearch) queryParams.set('search', debouncedSearch);
      if (category && category !== 'all') queryParams.set('category', category);
      if (city) queryParams.set('city', city);
      queryParams.set('page', page.toString());
      queryParams.set('limit', '8');

      // Update URL silently
      router.replace(`/events?${queryParams.toString()}`, { scroll: false });

      const res = await api.get(`/events?${queryParams.toString()}`);
      if (res.data?.data) {
        setEvents(res.data.data);
      }
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, city, page, router]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setCity('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ── Header Title ───────────────────────────────── */}
      <div className="space-y-2">
        <span className="text-xs uppercase font-semibold tracking-wider text-kage-gold flex items-center gap-1.5">
          <span>影</span> Katalog Eksplorasi
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-kage-washi font-normal">
          Jadwal Sinema 4D & Event Kreatif
        </h1>
        <p className="text-xs sm:text-sm text-kage-mist max-w-2xl font-sans">
          Pilih dari berbagai tayangan sinematik eksklusif dengan efek sensorik 4 dimensi, pertunjukan musik langsung, dan workshop.
        </p>
      </div>

      {/* ── Search & Filter Controls ───────────────────── */}
      <div className="bg-kage-yoru border border-kage-border rounded-lg p-4 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Debounced Search */}
          <div className="md:col-span-6 relative flex items-center">
            <Search className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul film, workshop, sutradara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2 pl-9 text-xs text-kage-washi placeholder:text-kage-mist-dim focus:outline-none focus:border-kage-gold transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 text-kage-mist-dim hover:text-kage-washi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City Selector */}
          <div className="md:col-span-3 relative flex items-center">
            <MapPin className="w-4 h-4 text-kage-gold absolute left-3 pointer-events-none" />
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2 pl-9 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition cursor-pointer"
            >
              <option value="">Semua Lokasi / Kota</option>
              <option value="Jakarta">Jakarta</option>
              <option value="Bandung">Bandung</option>
              <option value="Surabaya">Surabaya</option>
              <option value="Yogyakarta">Yogyakarta</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="md:col-span-3 flex items-center justify-end">
            {(search || (category && category !== 'all') || city) && (
              <button
                onClick={clearFilters}
                className="text-xs text-kage-mist-dim hover:text-kage-washi flex items-center gap-1.5 transition px-2 py-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-kage-border/60">
          <button
            onClick={() => {
              setCategory('all');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded text-xs transition ${
              category === 'all'
                ? 'bg-kage-gold text-kage-black font-semibold shadow-sm'
                : 'bg-kage-yoru-light text-kage-mist hover:text-kage-washi border border-kage-border'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.slug);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded text-xs transition ${
                category === cat.slug
                  ? 'bg-kage-gold text-kage-black font-semibold shadow-sm'
                  : 'bg-kage-yoru-light text-kage-mist hover:text-kage-washi border border-kage-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Events Grid ────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-7 h-7 text-kage-gold animate-spin" />
          <p className="text-xs text-kage-mist">Memuat daftar tayang...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>

          {/* ── Pagination Controls ─────────────────────── */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded bg-kage-yoru border border-kage-border text-kage-mist hover:text-kage-washi disabled:opacity-40 transition"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded text-xs font-medium transition ${
                    page === p
                      ? 'bg-kage-red text-white font-bold shadow-md'
                      : 'bg-kage-yoru text-kage-mist hover:text-kage-washi border border-kage-border'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="p-2 rounded bg-kage-yoru border border-kage-border text-kage-mist hover:text-kage-washi disabled:opacity-40 transition"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-kage-yoru border border-dashed border-kage-border rounded-lg space-y-3">
          <p className="text-sm text-kage-washi font-medium">
            Tidak ada event yang sesuai dengan pencarian Anda.
          </p>
          <p className="text-xs text-kage-mist">
            Coba ganti kata kunci atau pilih semua kategori.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded text-xs bg-kage-yoru-light text-kage-gold border border-kage-border hover:bg-kage-border transition"
          >
            Tampilkan Semua Event
          </button>
        </div>
      )}
    </div>
  );
}

export default function EventsDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
          <p className="text-xs text-kage-mist">Memuat katalog...</p>
        </div>
      }
    >
      <EventsDiscoveryContent />
    </Suspense>
  );
}
