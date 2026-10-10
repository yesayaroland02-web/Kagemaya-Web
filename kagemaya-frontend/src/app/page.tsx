'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { EventItem, Category } from '@/types/event';
import EventCard from '@/components/event/EventCard';
import { Search, MapPin, Film, Sparkles, Compass, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch events & categories simultaneously
        const [eventRes, catRes] = await Promise.allSettled([
          api.get('/events?limit=6'),
          api.get('/categories'),
        ]);

        if (eventRes.status === 'fulfilled' && eventRes.value.data.data) {
          setEvents(eventRes.value.data.data);
        }
        if (catRes.status === 'fulfilled' && catRes.value.data.data) {
          setCategories(catRes.value.data.data);
        }
      } catch (err) {
        console.error('Error loading landing page data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.set('search', searchKeyword);
    if (selectedCity) params.set('city', selectedCity);
    router.push(`/events?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── 1. HERO SECTION ───────────────────────────── */}
      <section className="relative w-full pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-kage-border overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-kage-red/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[200px] bg-kage-gold/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          {/* Badge Tagline */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-kage-border bg-kage-yoru/80 text-xs text-kage-gold tracking-wide">
            <span className="font-serif">影</span>
            <span>Platform Sinema Imersif & Event Kreatif #1</span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-kage-washi leading-[1.15]">
            Di Balik Bayangan, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-kage-washi via-kage-gold to-kage-vermilion">
              Ilusi Menjadi Nyata.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-kage-mist leading-relaxed font-sans">
            Temukan pemutaran film sinema 4D dengan stimulasi fisik penuh aroma, angin, dan getaran hidrolik, serta workshop pembuatan efek suara sinema.
          </p>

          {/* Search Box Card */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-3xl mx-auto mt-8 p-2 rounded-lg bg-kage-yoru border border-kage-border-light shadow-2xl flex flex-col sm:flex-row items-center gap-2"
          >
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-3 px-3 py-2 w-full">
              <Search className="w-4 h-4 text-kage-mist-dim shrink-0" />
              <input
                type="text"
                placeholder="Cari judul film, workshop, atau kreator..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-transparent text-sm text-kage-washi placeholder:text-kage-mist-dim focus:outline-none"
              />
            </div>

            {/* City Selector */}
            <div className="sm:border-l border-kage-border flex items-center gap-2 px-3 py-2 w-full sm:w-auto">
              <MapPin className="w-4 h-4 text-kage-gold shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-xs text-kage-washi focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-kage-yoru text-kage-washi">
                  Semua Kota
                </option>
                <option value="Jakarta" className="bg-kage-yoru text-kage-washi">
                  Jakarta
                </option>
                <option value="Bandung" className="bg-kage-yoru text-kage-washi">
                  Bandung
                </option>
                <option value="Surabaya" className="bg-kage-yoru text-kage-washi">
                  Surabaya
                </option>
                <option value="Yogyakarta" className="bg-kage-yoru text-kage-washi">
                  Yogyakarta
                </option>
              </select>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold tracking-wide transition shadow-md shrink-0"
            >
              Cari Tiket
            </button>
          </form>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="text-xs text-kage-mist-dim mr-2">Pilihan Cepat:</span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/events?category=${cat.slug}`}
                className="px-3 py-1 rounded text-xs bg-kage-yoru-light hover:bg-kage-border text-kage-mist hover:text-kage-gold border border-kage-border transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. FEATURED EVENTS SECTION ────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-kage-gold mb-1">
              <Film className="w-3.5 h-3.5" />
              <span>Jadwal Tayang Terkini</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-kage-washi font-normal">
              Event & Sinema Unggulan
            </h2>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-kage-gold hover:text-kage-washi transition"
          >
            <span>Lihat Semua Katalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Event Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded bg-kage-yoru border border-kage-border animate-pulse"
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-kage-border rounded p-8">
            <p className="text-sm text-kage-mist">Belum ada event yang dijadwalkan.</p>
          </div>
        )}
      </section>

      {/* ── 3. BRAND PILLARS & FEATURES ───────────────── */}
      <section className="w-full bg-kage-yoru/50 border-y border-kage-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-kage-gold">
              Kenapa Kagemaya?
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-kage-washi">
              Standar Pengalaman Sinematik Baru
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded bg-kage-yoru border border-kage-border space-y-3">
              <div className="w-10 h-10 rounded bg-kage-red/10 border border-kage-red/30 flex items-center justify-center text-kage-vermilion">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-kage-washi font-medium">
                Sensasi 4D Presisi
              </h3>
              <p className="text-xs text-kage-mist leading-relaxed">
                Sinkronisasi efek getaran gerak kursi, hembusan angin, dan partikel aroma yang disesuaikan secara sinematis per adegan film.
              </p>
            </div>

            <div className="p-6 rounded bg-kage-yoru border border-kage-border space-y-3">
              <div className="w-10 h-10 rounded bg-kage-gold/10 border border-kage-gold/30 flex items-center justify-center text-kage-gold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-kage-washi font-medium">
                Sistem Referral & Reward
              </h3>
              <p className="text-xs text-kage-mist leading-relaxed">
                Ajak teman menonton bersama untuk mendapatkan 10.000 poin dan kupon potongan harga Rp25.000 yang bisa digunakan langsung saat checkout.
              </p>
            </div>

            <div className="p-6 rounded bg-kage-yoru border border-kage-border space-y-3">
              <div className="w-10 h-10 rounded bg-kage-yoru-light border border-kage-border-light flex items-center justify-center text-kage-washi">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-kage-washi font-medium">
                Dukungan Kreator Mandiri
              </h3>
              <p className="text-xs text-kage-mist leading-relaxed">
                Platform kurasi independen yang mempertemukan sutradara, seniman foley efek suara, dan penggemar budaya sinematik Jepang.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
