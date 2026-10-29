'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { EventItem } from '@/types/event';
import { getImageUrl, formatDate } from '@/lib/utils';
import EventCard from '@/components/event/EventCard';
import Toast from '@/components/ui/Toast';
import {
  Calendar,
  Check,
  Film,
  Heart,
  Loader2,
  Mail,
  Plus,
  Share2,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

interface OrganizerProfileData {
  id: string;
  name: string;
  email: string;
  profile_picture?: string | null;
  organization_name: string;
  bio: string;
  created_at: string;
  followers_count: number;
  events_count: number;
  is_following: boolean;
  events: EventItem[];
}

export default function OrganizerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const organizerId = params.id as string;
  const { user } = useAuth();

  const [organizer, setOrganizer] = useState<OrganizerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadOrganizer() {
      try {
        setLoading(true);
        const res = await api.get(`/organizers/${organizerId}`);
        if (res.data?.data) {
          const data = res.data.data;
          setOrganizer(data);
          setIsFollowing(data.is_following);
          setFollowersCount(data.followers_count);
        }
      } catch (err: any) {
        console.error('Failed to load organizer:', err);
        setToast({ message: 'Profil organizer tidak ditemukan atau gagal dimuat.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (organizerId) {
      loadOrganizer();
    }
  }, [organizerId]);

  const handleToggleFollow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.id === organizerId) {
      setToast({
        message: 'Anda tidak dapat mengikuti akun Anda sendiri.',
        type: 'error',
      });
      return;
    }

    if (isUpdatingFollow) return;

    try {
      setIsUpdatingFollow(true);
      if (isFollowing) {
        const res = await api.delete(`/follows/${organizerId}`);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        setToast({ message: 'Berhenti mengikuti organizer.', type: 'success' });
      } else {
        const res = await api.post(`/follows/${organizerId}`);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        setToast({ message: 'Berhasil mengikuti organizer!', type: 'success' });
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Gagal mengubah status pertemanan/follow.',
        type: 'error',
      });
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Memuat profil organizer...</p>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-kage-washi">Organizer Tidak Ditemukan</h2>
        <p className="text-xs text-kage-mist">Penyelenggara yang Anda cari tidak tersedia atau belum terdaftar.</p>
        <Link
          href="/events"
          className="inline-block px-5 py-2 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold uppercase tracking-wider transition"
        >
          Kembali ke Eksplorasi
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === organizer.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── 1. HEADER PROFILE CARD ──────────────────────────── */}
      <div className="rounded-xl bg-kage-yoru border border-kage-border p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-kage-gold/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-kage-yoru-light border-2 border-kage-gold/40 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              {organizer.profile_picture ? (
                <img
                  src={getImageUrl(organizer.profile_picture)}
                  alt={organizer.organization_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-serif text-3xl font-bold text-kage-gold">
                  {organizer.organization_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-kage-gold/15 text-kage-gold border border-kage-gold/30">
                  Organizer Terverifikasi
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-kage-washi font-medium">
                {organizer.organization_name}
              </h1>
              <p className="text-xs text-kage-mist max-w-xl leading-relaxed">
                {organizer.bio}
              </p>

              {/* Stats Counters */}
              <div className="flex items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5 text-kage-mist-dim font-sans">
                  <Users className="w-3.5 h-3.5 text-kage-gold" />
                  <span className="font-semibold text-kage-washi font-mono">{followersCount}</span>
                  <span>Pengikut</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 text-kage-mist-dim font-sans">
                  <Film className="w-3.5 h-3.5 text-kage-gold" />
                  <span className="font-semibold text-kage-washi font-mono">{organizer.events_count}</span>
                  <span>Event Aktif</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action: Follow / Edit */}
          <div className="flex items-center gap-3">
            {!isOwner ? (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={isUpdatingFollow}
                className={`px-6 py-2.5 rounded font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                  isFollowing
                    ? 'bg-kage-gold/20 text-kage-gold border border-kage-gold hover:bg-kage-gold/30'
                    : 'bg-kage-gold text-kage-black hover:bg-yellow-500 font-bold'
                }`}
              >
                {isUpdatingFollow ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Mengikuti</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/organizer/dashboard"
                className="px-5 py-2.5 rounded border border-kage-border text-xs font-medium text-kage-washi hover:border-kage-gold hover:text-kage-gold transition"
              >
                Dashboard Anda
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. ORGANIZER'S EVENTS LIST ───────────────────────── */}
      <div className="space-y-6">
        <div className="border-b border-kage-border pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-kage-gold uppercase tracking-wider">
            <Film className="w-4 h-4" />
            <span>Koleksi Sinema oleh {organizer.organization_name}</span>
          </div>
          <span className="text-xs text-kage-mist-dim">
            {organizer.events?.length || 0} Pertunjukan
          </span>
        </div>

        {organizer.events && organizer.events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {organizer.events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-kage-border rounded-lg p-6 bg-kage-yoru/30">
            <p className="text-xs text-kage-mist">
              Penyelenggara ini belum memiliki agenda pertunjukan aktif saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
