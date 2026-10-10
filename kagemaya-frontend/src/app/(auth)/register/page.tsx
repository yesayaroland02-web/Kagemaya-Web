'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Toast from '@/components/ui/Toast';
import { Eye, EyeOff, Lock, Mail, User, Gift, Building2, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<'CUSTOMER' | 'ORGANIZER'>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setToast({ message: 'Harap isi nama lengkap Anda (minimal 2 karakter).', type: 'error' });
      return;
    }

    if (name.trim().length < 2) {
      setToast({ message: 'Nama minimal 2 karakter.', type: 'error' });
      return;
    }

    if (!email.trim()) {
      setToast({ message: 'Harap isi alamat email Anda.', type: 'error' });
      return;
    }

    if (!password) {
      setToast({ message: 'Harap isi password Anda.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ message: 'Password minimal 6 karakter.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      };

      // Referral hanya diizinkan untuk customer sesuai aturan PRD
      if (role === 'CUSTOMER' && referredBy.trim()) {
        payload.referredBy = referredBy.trim().toUpperCase();
      }

      const res = await api.post('/auth/register', payload);

      if (res.data?.success) {
        const authData = res.data.data;

        // Auto-login jika backend mengembalikan token & user
        if (authData?.token && authData?.user) {
          login(authData.user, authData.token);
          setToast({
            message: 'Registrasi berhasil! Anda langsung masuk ke akun.',
            type: 'success',
          });
          setTimeout(() => {
            router.push(role === 'ORGANIZER' ? '/user/profile' : '/');
          }, 1200);
        } else {
          setToast({
            message: 'Registrasi berhasil! Mengalihkan ke halaman masuk...',
            type: 'success',
          });
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMsg = 'Registrasi gagal. Silakan periksa kembali input Anda.';

      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMsg = 'Koneksi ke server backend gagal. Pastikan server backend di port 5000 sedang berjalan.';
      }

      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md bg-kage-yoru border border-kage-border rounded-lg shadow-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded bg-kage-red mx-auto flex items-center justify-center text-white font-serif font-bold text-xl">
            影
          </div>
          <h1 className="font-serif text-2xl text-kage-washi font-normal">
            Daftar Akun Kagemaya
          </h1>
          <p className="text-xs text-kage-mist font-sans">
            Mulai eksplorasi sinema 4D atau terbitkan event Anda
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-kage-yoru-light border border-kage-border rounded-md text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setRole('CUSTOMER');
            }}
            className={`py-2 rounded transition flex items-center justify-center gap-1.5 ${
              role === 'CUSTOMER'
                ? 'bg-kage-yoru text-kage-gold border border-kage-gold/30 shadow-sm'
                : 'text-kage-mist hover:text-kage-washi'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sebagai Penonton</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('ORGANIZER');
              setReferredBy(''); // Hapus referral jika switch ke organizer
            }}
            className={`py-2 rounded transition flex items-center justify-center gap-1.5 ${
              role === 'ORGANIZER'
                ? 'bg-kage-yoru text-kage-gold border border-kage-gold/30 shadow-sm'
                : 'text-kage-mist hover:text-kage-washi'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Sebagai Organizer</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-kage-mist block">
              {role === 'ORGANIZER' ? 'Nama Organisasi / Kolektif' : 'Nama Lengkap'}
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                placeholder={role === 'ORGANIZER' ? 'Contoh: Aozora Cinema Collective' : 'Contoh: Budi Santoso'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2.5 pl-9 text-xs text-kage-washi placeholder:text-kage-mist-dim focus:outline-none focus:border-kage-gold transition"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-kage-mist block">
              Alamat Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2.5 pl-9 text-xs text-kage-washi placeholder:text-kage-mist-dim focus:outline-none focus:border-kage-gold transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-kage-mist block">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2.5 pl-9 pr-9 text-xs text-kage-washi placeholder:text-kage-mist-dim focus:outline-none focus:border-kage-gold transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-kage-mist-dim hover:text-kage-washi transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Referral Code (Khusus Customer sesuai aturan PRD) */}
          {role === 'CUSTOMER' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-kage-mist">
                  Kode Referral Teman (Opsional)
                </label>
                <span className="text-[10px] text-kage-gold">Bonus Kupon Diskon Rp25.000</span>
              </div>
              <div className="relative flex items-center">
                <Gift className="w-4 h-4 text-kage-gold absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Contoh: BUDI1234 (opsional)"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value.toUpperCase())}
                  className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2.5 pl-9 text-xs text-kage-washi placeholder:text-kage-mist-dim uppercase focus:outline-none focus:border-kage-gold transition font-mono"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-60 text-white text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 shadow-md mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <>
                <span>Daftar {role === 'ORGANIZER' ? 'Organizer' : 'Penonton'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-kage-border/60">
          <p className="text-xs text-kage-mist">
            Sudah memiliki akun?{' '}
            <Link
              href="/login"
              className="text-kage-gold hover:underline font-medium"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
