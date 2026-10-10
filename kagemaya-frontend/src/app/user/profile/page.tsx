'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { UserProfile, PointTransaction, Coupon } from '@/types/user';
import { formatRupiah, formatDate, formatDateTime, getImageUrl } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import {
  User,
  Mail,
  Lock,
  Gift,
  Coins,
  Ticket,
  Camera,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  Loader2,
  Save,
  ArrowUpRight,
} from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const { user: authUser, token, isLoading: authLoading, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit Profile State
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Rewards & Referral State (Day 7)
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'rewards' | 'security'>('profile');

  // Load Profile, Points & Coupons
  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }

    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);

        const [profileRes, pointsRes, couponsRes] = await Promise.allSettled([
          api.get('/me/profile'),
          api.get('/me/points'),
          api.get('/me/coupons'),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data.data) {
          const p = profileRes.value.data.data;
          setProfile(p);
          setName(p.name);
          if (p.profile_picture) {
            setAvatarPreview(getImageUrl(p.profile_picture));
          }
        }

        if (pointsRes.status === 'fulfilled' && pointsRes.value.data.data) {
          const pt = pointsRes.value.data.data;
          setPointBalance(pt.balance || 0);
          setPointHistory(pt.history || []);
        }

        if (couponsRes.status === 'fulfilled' && couponsRes.value.data.data) {
          setCoupons(couponsRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    }
  }, [token, authLoading, router]);

  // Handle Avatar Change
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'Ukuran foto maksimal 2MB.', type: 'error' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Submit Profile Update (Day 6)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ message: 'Nama tidak boleh kosong.', type: 'error' });
      return;
    }

    try {
      setSavingProfile(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.patch('/me/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) {
        const updated = res.data.data;
        setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
        updateUser({
          name: updated.name,
          profile_picture: updated.profile_picture,
        });
        setToast({ message: 'Profil berhasil diperbarui!', type: 'success' });
        setAvatarFile(null);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memperbarui profil.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit Password Change (Day 6)
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setToast({ message: 'Lengkapi password lama dan password baru.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Password baru minimal 6 karakter.', type: 'error' });
      return;
    }

    try {
      setSavingPassword(true);
      await api.patch('/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setToast({ message: 'Password berhasil diubah!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengganti password.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  // Copy Referral Code (Day 7)
  const handleCopyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopiedReferral(true);
      setToast({ message: 'Kode referral berhasil disalin!', type: 'success' });
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Memuat informasi akun...</p>
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

      {/* ── 1. PROFILE HEADER CARD ─────────────────────────── */}
      <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border shadow-2xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar with Upload Trigger */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-kage-yoru-light border-2 border-kage-gold/40 flex items-center justify-center overflow-hidden shadow-inner">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={profile?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-serif text-3xl text-kage-gold font-bold">
                  {profile?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-kage-red hover:bg-kage-vermilion text-white flex items-center justify-center shadow-lg transition"
              title="Ganti Foto Avatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-serif text-2xl text-kage-washi font-medium">
                {profile?.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-kage-yoru-light text-kage-gold border border-kage-gold/30">
                {profile?.role}
              </span>
            </div>
            <p className="text-xs text-kage-mist font-sans">{profile?.email}</p>
            <p className="text-[11px] text-kage-mist-dim font-sans">
              Anggota sejak {profile?.created_at ? formatDate(profile.created_at) : '-'}
            </p>
          </div>
        </div>

        {/* Quick Referral Tag */}
        {profile?.referral_code && (
          <div className="p-3.5 rounded-lg bg-kage-yoru-light border border-kage-border text-center sm:text-right space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-kage-mist-dim block">
              Kode Referral Kamu
            </span>
            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <span className="font-mono font-bold text-sm text-kage-gold tracking-widest">
                {profile.referral_code}
              </span>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="p-1 text-kage-mist hover:text-kage-washi transition"
                title="Salin Kode"
              >
                {copiedReferral ? (
                  <Check className="w-3.5 h-3.5 text-kage-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. TABS NAVIGATION ─────────────────────────────── */}
      <div className="flex border-b border-kage-border gap-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-kage-gold text-kage-gold'
              : 'border-transparent text-kage-mist hover:text-kage-washi'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Pengaturan Profil</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
            activeTab === 'rewards'
              ? 'border-kage-gold text-kage-gold'
              : 'border-transparent text-kage-mist hover:text-kage-washi'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Poin & Rewards Referral</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-kage-gold text-kage-gold'
              : 'border-transparent text-kage-mist hover:text-kage-washi'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Keamanan & Password</span>
        </button>
      </div>

      {/* ── 3. TAB CONTENT ─────────────────────────────────── */}

      {/* ── TAB 1: EDIT PROFILE (DAY 6) ───────────────────── */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-kage-yoru border border-kage-border rounded-lg p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-serif text-lg text-kage-washi font-normal">
              Informasi Pengguna
            </h3>
            <p className="text-xs text-kage-mist">
              Perbarui nama akun dan foto avatar profil Anda.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-kage-mist block">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-kage-mist block">
                Alamat Email (Tidak dapat diubah)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full bg-kage-black/60 border border-kage-border rounded px-3 py-2 text-xs text-kage-mist-dim cursor-not-allowed"
              />
            </div>

            {avatarFile && (
              <p className="text-[11px] text-kage-gold">
                Foto baru siap diunggah: <span className="font-medium">{avatarFile.name}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 shadow-md"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: REWARDS & REFERRAL (DAY 7) ──────────────── */}
      {activeTab === 'rewards' && (
        <div className="space-y-8">
          {/* Rewards Grid: Points & Active Coupons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Widget Saldo Poin */}
            <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-kage-gold flex items-center gap-2">
                  <Coins className="w-4 h-4 text-kage-gold" />
                  <span>Saldo Poin Washi</span>
                </span>
                <span className="text-[10px] text-kage-mist-dim">1 Poin = Rp1</span>
              </div>

              <div className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl font-bold text-kage-washi">
                  {pointBalance.toLocaleString('id-ID')}{' '}
                  <span className="text-sm font-sans font-normal text-kage-gold">Poin</span>
                </div>
                <p className="text-xs text-kage-mist">
                  Dapat digunakan sebagai potongan langsung hingga 50% saat checkout tiket.
                </p>
              </div>

              <div className="p-3 rounded bg-kage-yoru-light border border-kage-border/80 text-[11px] text-kage-mist space-y-1">
                <p className="font-medium text-kage-washi">Cara Memperoleh Poin:</p>
                <p>Bagikan kode referral Anda ke teman. Setiap teman yang mendaftar memberikan <span className="text-kage-gold font-semibold">+10.000 Poin</span> ke akun Anda.</p>
              </div>
            </div>

            {/* Referral Sharing Box */}
            <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-kage-vermilion flex items-center gap-2">
                  <Gift className="w-4 h-4 text-kage-vermilion" />
                  <span>Program Ajak Teman (Referral)</span>
                </span>
                <p className="text-xs text-kage-mist leading-relaxed">
                  Teman Anda akan langsung mendapatkan <span className="text-kage-gold font-semibold">Kupon Diskon Rp25.000</span> saat mendaftar dengan kode Anda!
                </p>
              </div>

              <div className="p-4 rounded-lg bg-kage-yoru-light border border-kage-border space-y-2">
                <span className="text-[10px] text-kage-mist-dim uppercase tracking-wider block">
                  Kode Unik Anda:
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-bold text-kage-gold tracking-widest">
                    {profile?.referral_code}
                  </span>
                  <button
                    onClick={handleCopyReferral}
                    className="px-3 py-1.5 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold transition flex items-center gap-1.5 shadow"
                  >
                    {copiedReferral ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Kupon Referral Aktif */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-kage-washi font-normal flex items-center gap-2">
              <Ticket className="w-4 h-4 text-kage-gold" />
              <span>Daftar Kupon Referral Aktif ({coupons.length})</span>
            </h3>

            {coupons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-lg bg-kage-yoru border border-kage-border space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-kage-gold px-2 py-0.5 rounded bg-kage-yoru-light border border-kage-gold/30">
                        Kupon Diskon
                      </span>
                      <span className="text-[10px] text-kage-success font-medium">Aktif</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="font-serif text-2xl font-bold text-kage-washi">
                        {formatRupiah(c.discount_amount)}
                      </span>
                      <p className="text-[11px] text-kage-mist">
                        Potongan harga saat checkout tiket
                      </p>
                    </div>

                    <div className="pt-2 border-t border-kage-border text-[10px] text-kage-mist-dim flex items-center gap-1">
                      <Clock className="w-3 h-3 text-kage-mist-dim" />
                      <span>Berlaku hingga {formatDate(c.expires_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-lg bg-kage-yoru border border-dashed border-kage-border text-center">
                <p className="text-xs text-kage-mist">
                  Belum ada kupon referral aktif saat ini.
                </p>
              </div>
            )}
          </div>

          {/* Riwayat Mutasi Poin */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-kage-washi font-normal">
              Riwayat Transaksi Poin
            </h3>

            {pointHistory.length > 0 ? (
              <div className="bg-kage-yoru border border-kage-border rounded-lg overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-kage-yoru-light text-kage-mist-dim border-b border-kage-border uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Aktivitas</th>
                      <th className="py-3 px-4">Jumlah Poin</th>
                      <th className="py-3 px-4">Masa Berlaku</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kage-border text-kage-washi">
                    {pointHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-kage-yoru-light/50 transition">
                        <td className="py-3 px-4 text-kage-mist">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              item.type === 'EARN'
                                ? 'bg-kage-success/20 text-kage-success'
                                : 'bg-kage-error/20 text-kage-error'
                            }`}
                          >
                            {item.type === 'EARN' ? 'Perolehan Referral' : 'Dipakai Checkout'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          <span
                            className={
                              item.type === 'EARN' ? 'text-kage-success' : 'text-kage-error'
                            }
                          >
                            {item.type === 'EARN' ? '+' : '-'}
                            {item.amount.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-kage-mist-dim text-[11px]">
                          {item.expires_at ? formatDate(item.expires_at) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 rounded-lg bg-kage-yoru border border-dashed border-kage-border text-center">
                <p className="text-xs text-kage-mist">Belum ada riwayat transaksi poin.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: SECURITY & PASSWORD (DAY 6) ─────────────── */}
      {activeTab === 'security' && (
        <div className="max-w-xl bg-kage-yoru border border-kage-border rounded-lg p-6 shadow-xl space-y-6">
          <div>
            <h3 className="font-serif text-lg text-kage-washi font-normal">
              Ganti Password
            </h3>
            <p className="text-xs text-kage-mist">
              Pastikan Anda menggunakan kombinasi password yang kuat untuk melindungi akun.
            </p>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-kage-mist block">
                Password Saat Ini
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2 pl-9 pr-9 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 text-kage-mist-dim hover:text-kage-washi transition"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-kage-mist block">
                Password Baru (Minimal 6 karakter)
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2 pl-9 pr-9 text-xs text-kage-washi focus:outline-none focus:border-kage-gold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 text-kage-mist-dim hover:text-kage-washi transition"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white text-xs font-semibold tracking-wide transition flex items-center gap-2 shadow-md"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Perbarui Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
