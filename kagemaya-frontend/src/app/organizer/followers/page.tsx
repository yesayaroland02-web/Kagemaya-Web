'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { formatDate, getImageUrl } from '@/lib/utils';
import {
  Users,
  Search,
  Calendar,
  Mail,
  ShieldCheck,
  Loader2,
  TrendingUp,
  Layers,
  Plus,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

interface FollowerItem {
  followed_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    role: string;
    member_since: string;
  };
}

export default function OrganizerFollowersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizers/me/followers');
      if (res.data?.data?.followers) {
        setFollowers(res.data.data.followers);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar followers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role === 'ORGANIZER') {
      fetchFollowers();
    } else if (!authLoading && (!user || user.role !== 'ORGANIZER')) {
      setLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Memuat daftar pengikut organizer Anda...</p>
      </div>
    );
  }

  if (!user || user.role !== 'ORGANIZER') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-kage-washi font-normal">
          Akses Khusus Organizer
        </h2>
        <p className="text-xs text-kage-mist">
          Halaman ini khusus diperuntukkan bagi akun Event Organizer untuk melihat penonton yang mengikuti profil Anda.
        </p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold uppercase tracking-wider transition"
        >
          Masuk sebagai Organizer
        </Link>
      </div>
    );
  }

  const filteredFollowers = followers.filter(
    (f) =>
      f.user.name.toLowerCase().includes(search.toLowerCase()) ||
      f.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-kage-yoru text-kage-washi py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Breadcrumb & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-kage-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/organizer/dashboard"
                className="text-xs text-kage-mist hover:text-kage-gold flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <span className="text-xs text-kage-border">/</span>
              <span className="text-[11px] uppercase tracking-wider text-kage-gold font-semibold bg-kage-gold/10 px-2 py-0.5 rounded border border-kage-gold/20">
                Komunitas &amp; Pengikut
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-kage-washi">
              Daftar Pengikut (Followers)
            </h1>
            <p className="text-xs text-kage-mist">
              Lihat seluruh penonton dan anggota komunitas sinema yang mengikuti profil organizer Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/organizer/${user.id}`}
              className="px-4 py-2 rounded text-xs font-medium border border-kage-gold text-kage-gold hover:bg-kage-gold/10 transition flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Profil Publik Saya</span>
            </Link>
            <Link
              href="/organizer/dashboard"
              className="px-4 py-2 rounded text-xs font-medium border border-kage-border hover:border-kage-gold text-kage-washi transition flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-kage-gold" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Counter Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg bg-kage-yoru-card border border-kage-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-kage-mist-dim block">
                Total Pengikut
              </span>
              <span className="font-serif text-3xl font-bold text-kage-washi font-mono">
                {followers.length}
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-kage-gold/10 border border-kage-gold/20 flex items-center justify-center text-kage-gold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-lg bg-kage-yoru-card border border-kage-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-kage-mist-dim block">
                Terkoneksi Aktif
              </span>
              <span className="font-serif text-3xl font-bold text-kage-gold font-mono">
                100%
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-kage-success/10 border border-kage-success/20 flex items-center justify-center text-kage-success">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-lg bg-kage-yoru-card border border-kage-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-kage-mist-dim block">
                Jangkauan Audience
              </span>
              <span className="text-xs text-kage-mist leading-relaxed block mt-1">
                Notifikasi instan untuk setiap rilis film 4D baru Anda.
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-kage-mist-dim absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email penonton..."
              className="w-full bg-kage-black/70 border border-kage-border focus:border-kage-gold rounded-lg pl-9 pr-3 py-2 text-xs text-kage-washi placeholder-kage-mist-dim outline-none transition"
            />
          </div>
          <span className="text-xs text-kage-mist-dim">
            Menampilkan {filteredFollowers.length} dari {followers.length} pengikut
          </span>
        </div>

        {/* Followers List / Table */}
        {filteredFollowers.length > 0 ? (
          <div className="border border-kage-border rounded-lg overflow-hidden bg-kage-yoru-card shadow-xl">
            <div className="divide-y divide-kage-border/70">
              {filteredFollowers.map((item) => (
                <div
                  key={item.user.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-kage-black/30 transition"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-kage-yoru border border-kage-gold/30 flex items-center justify-center overflow-hidden shrink-0 shadow">
                      {item.user.profile_picture ? (
                        <img
                          src={getImageUrl(item.user.profile_picture)}
                          alt={item.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-serif text-sm font-bold text-kage-gold">
                          {item.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-kage-washi">
                          {item.user.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider bg-kage-yoru text-kage-gold border border-kage-gold/20">
                          {item.user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-kage-mist-dim">
                        <Mail className="w-3.5 h-3.5 text-kage-mist-dim" />
                        <span>{item.user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Followed Date */}
                  <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-0 border-kage-border/40 pt-2 sm:pt-0">
                    <span className="text-[10px] uppercase tracking-wider text-kage-mist-dim font-sans">
                      Mulai Mengikuti
                    </span>
                    <span className="text-xs text-kage-washi font-medium flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-kage-gold" />
                      {formatDate(item.followed_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-kage-border rounded-lg p-6 bg-kage-yoru/30 space-y-3">
            <Users className="w-8 h-8 text-kage-mist-dim mx-auto" />
            <h3 className="font-serif text-base text-kage-washi font-medium">
              {search ? 'Tidak ada pengikut yang cocok' : 'Belum Ada Pengikut'}
            </h3>
            <p className="text-xs text-kage-mist max-w-md mx-auto">
              {search
                ? `Tidak ditemukan penonton dengan kata kunci "${search}".`
                : 'Ketika penonton menekan tombol Follow di halaman profil organizer Anda, nama mereka akan tampil di sini.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
