'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { EventItem } from '@/types/event';
import EventCard from '@/components/event/EventCard';
import Toast from '@/components/ui/Toast';
import { Bookmark, Compass, Loader2, Sparkles, HeartCrack } from 'lucide-react';

interface WishlistItem {
  id: string;
  created_at: string;
  event: EventItem;
}

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wishlists');
      if (res.data?.data) {
        setWishlists(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch wishlists:', err);
      setToast({
        message: 'Gagal memuat daftar wishlist Anda. Silakan coba lagi.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchWishlists();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleWishlistChange = (eventId: string, isWishlisted: boolean) => {
    if (!isWishlisted) {
      setWishlists((prev) => prev.filter((item) => item.event.id !== eventId));
      setToast({
        message: 'Event berhasil dihapus dari Wishlist.',
        type: 'success',
      });
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Memuat koleksi wishlist Anda...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-kage-yoru border border-kage-border flex items-center justify-center text-kage-gold">
          <Bookmark className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl text-kage-washi font-normal">
          Akses Wishlist Anda
        </h2>
        <p className="text-sm text-kage-mist max-w-md mx-auto">
          Masuk ke akun Kagemaya Anda untuk melihat dan mengelola sinema interaktif yang telah Anda simpan.
        </p>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold uppercase tracking-wider transition shadow-lg"
          >
            Masuk Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="border-b border-kage-border pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-kage-gold uppercase tracking-wider">
            <Bookmark className="w-4 h-4 fill-kage-gold" />
            <span>Koleksi Disimpan</span>
          </div>
          <h1 className="font-serif text-3xl text-kage-washi font-normal">
            Wishlist Saya
          </h1>
          <p className="text-xs text-kage-mist">
            Daftar event dan sinema pilihan yang Anda simpan untuk dipesan nanti.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-kage-mist-dim font-sans">
          <span>Total Tersimpan:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-kage-gold/10 text-kage-gold border border-kage-gold/20 font-semibold font-mono">
            {wishlists.length}
          </span>
        </div>
      </div>

      {/* List or Empty State */}
      {wishlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlists.map((item) => (
            <EventCard
              key={item.id}
              event={item.event}
              initialWishlisted={true}
              onWishlistChange={handleWishlistChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-kage-border rounded-lg p-8 max-w-xl mx-auto space-y-5 bg-kage-yoru/40">
          <div className="w-14 h-14 mx-auto rounded-full bg-kage-yoru border border-kage-border flex items-center justify-center text-kage-mist-dim">
            <HeartCrack className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl text-kage-washi font-medium">
              Wishlist Anda Masih Kosong
            </h3>
            <p className="text-xs text-kage-mist leading-relaxed">
              Jelajahi beragam pemutaran film 4D dan pertunjukan sinema unik di Kagemaya, lalu klik ikon bookmark untuk menyimpannya di sini.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold uppercase tracking-wider transition shadow-md"
          >
            <Compass className="w-4 h-4" />
            <span>Eksplorasi Event Sekarang</span>
          </Link>
        </div>
      )}
    </div>
  );
}
