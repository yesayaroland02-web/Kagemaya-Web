
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import api from '@/lib/axios';
import Toast from '@/components/ui/Toast';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    // Ambil token dari tautan email.
    const urlToken = new URLSearchParams(
      window.location.search
    ).get('token');

    if (urlToken) {
      setToken(urlToken);

      // Hapus token dari address bar setelah dibaca.
      window.history.replaceState(
        window.history.state,
        '',
        '/reset-password'
      );
    }

    setReady(true);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      setToast({
        message: 'Tautan reset password tidak valid.',
        type: 'error',
      });
      return;
    }

    if (password.length < 6) {
      setToast({
        message: 'Password minimal 6 karakter.',
        type: 'error',
      });
      return;
    }

    if (password !== confirmPassword) {
      setToast({
        message: 'Konfirmasi password tidak sama.',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword,
      });

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setToken('');
    } catch (err: unknown) {
      let message =
        'Gagal memperbarui password. Silakan coba lagi.';

      if (axios.isAxiosError<{ message?: string }>(err)) {
        if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (!err.response) {
          message = 'Koneksi ke server backend gagal.';
        }
      }

      setToast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-kage-gold" />
      </div>
    );
  }

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
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded bg-kage-red mx-auto flex items-center justify-center text-white font-serif font-bold text-xl">
            影
          </div>

          <h1 className="font-serif text-2xl text-kage-washi">
            Reset Password
          </h1>

          <p className="text-xs text-kage-mist">
            Buat password baru untuk akun Kagemaya.id Anda.
          </p>
        </div>

        {success ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />

            <p className="text-sm text-kage-washi font-medium">
              Password Berhasil Diperbarui
            </p>

            <p className="text-xs text-kage-mist">
              Silakan login menggunakan password baru.
            </p>

            <Link
              href="/login"
              className="w-full py-2.5 rounded bg-kage-red hover:bg-kage-vermilion text-white text-xs font-semibold flex justify-center items-center gap-2"
            >
              Kembali ke Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !/^[a-fA-F0-9]{64}$/.test(token) ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-kage-washi">
              Tautan reset password tidak tersedia atau tidak valid.
            </p>

            <Link
              href="/forgot-password"
              className="text-xs text-kage-gold hover:underline"
            >
              Minta Tautan Reset Baru
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-xs text-kage-mist block"
              >
                Password Baru
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-kage-mist-dim absolute left-3 top-3 pointer-events-none" />

                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2.5 pl-9 pr-10 text-xs text-kage-washi focus:outline-none focus:border-kage-gold"
                />

                <button
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-kage-mist"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-xs text-kage-mist block"
              >
                Konfirmasi Password Baru
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-kage-mist-dim absolute left-3 top-3 pointer-events-none" />

                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2.5 pl-9 text-xs text-kage-washi focus:outline-none focus:border-kage-gold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Simpan Password Baru
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-3 border-t border-kage-border/60">
          <Link
            href="/login"
            className="text-xs text-kage-gold hover:underline"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
