'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EventItem } from '@/types/event';
import { formatRupiah, formatDate, getImageUrl } from '@/lib/utils';
import { Calendar, MapPin, Bookmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

interface EventCardProps {
  event: EventItem;
  initialWishlisted?: boolean;
  onWishlistChange?: (eventId: string, isWishlisted: boolean) => void;
}

export default function EventCard({
  event,
  initialWishlisted = false,
  onWishlistChange,
}: EventCardProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (isUpdating) return;

    try {
      setIsUpdating(true);
      if (isWishlisted) {
        await api.delete(`/wishlists/${event.id}`);
        setIsWishlisted(false);
        onWishlistChange?.(event.id, false);
      } else {
        await api.post(`/wishlists/${event.id}`);
        setIsWishlisted(true);
        onWishlistChange?.(event.id, true);
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Link
      href={`/events/${event.id}`}
      className="group relative flex flex-col rounded bg-kage-yoru border border-kage-border hover:border-kage-gold/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-lg"
    >
      {/* Banner Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-kage-black">
        <img
          src={getImageUrl(event.banner_url)}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded bg-kage-black/80 backdrop-blur-md text-kage-gold border border-kage-gold/30">
            {event.category?.name || 'Event'}
          </span>
        </div>

        {/* Bookmark / Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={isUpdating}
          title={isWishlisted ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 ${
            isWishlisted
              ? 'bg-kage-gold text-kage-black border-kage-gold shadow-md shadow-kage-gold/20 scale-105'
              : 'bg-kage-black/70 text-kage-mist border-kage-border hover:border-kage-gold hover:text-kage-gold hover:scale-105'
          }`}
        >
          <Bookmark
            className={`w-4 h-4 ${isWishlisted ? 'fill-kage-black' : ''}`}
          />
        </button>

        {event.is_sold_out && (
          <div className="absolute inset-0 bg-kage-black/70 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-3 py-1.5 rounded bg-kage-error/90 text-white font-serif font-bold text-xs tracking-wider uppercase shadow-lg">
              Habis Terjual
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Kota & Tanggal */}
          <div className="flex items-center gap-3 text-[11px] text-kage-mist-dim font-sans">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-kage-mist" />
              {event.city}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-kage-mist" />
              {formatDate(event.start_date)}
            </span>
          </div>

          {/* Judul Event */}
          <h3 className="font-serif font-semibold text-base text-kage-washi group-hover:text-kage-gold transition line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Organizer */}
          <p className="text-[11px] text-kage-mist truncate">
            oleh <span className="text-kage-washi font-medium">{event.organizer_name}</span>
          </p>
        </div>

        {/* Price & Action Footer */}
        <div className="pt-3 border-t border-kage-border/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-kage-mist-dim block uppercase font-sans">
              Mulai dari
            </span>
            <span className="text-sm font-semibold text-kage-gold font-sans">
              {event.starting_price > 0 ? formatRupiah(event.starting_price) : 'Gratis'}
            </span>
          </div>

          <span className="text-xs font-medium text-kage-washi group-hover:text-kage-gold flex items-center gap-1 transition">
            Detail →
          </span>
        </div>
      </div>
    </Link>
  );
}
