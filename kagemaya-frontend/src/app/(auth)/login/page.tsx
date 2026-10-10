'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Toast from '@/components/ui/Toast';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setToast({ message: 'Harap isi email dan password.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const { user, token } = res.data.data;

      login(user, token);
      setToast({ message: 'Login berhasil! Mengalihkan...', type: 'success' });

      setTimeout(() => {
        router.push(user.role === 'ORGANIZER' ? '/user/profile' : '/');
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Email atau password salah.';

      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        msg = 'Koneksi ke server backend gagal. Pastikan server backend di port 5000 sedang berjalan.';
      }

      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
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
            Masuk ke Akun
          </h1>
          <p className="text-xs text-kage-mist font-sans">
            Akses pemesanan tiket sinema 4D dan reward eksklusif
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-kage-mist">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-60 text-white text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 shadow-md mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-kage-border/60">
          <p className="text-xs text-kage-mist">
            Belum memiliki akun?{' '}
            <Link
              href="/register"
              className="text-kage-gold hover:underline font-medium"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
