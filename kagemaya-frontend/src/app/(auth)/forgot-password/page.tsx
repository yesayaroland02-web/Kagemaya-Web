
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import api from '@/lib/axios';
import Toast from '@/components/ui/Toast';
import { Mail, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email.trim()) {
      setToast({
        message: 'Alamat email wajib diisi.',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);

      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      setSubmitted(true);
    } catch (err: unknown) {
      let message =
        'Permintaan gagal diproses. Silakan coba lagi.';

      if (axios.isAxiosError<{ message?: string }>(err)) {
        if (err.response?.data?.message) {
          message = err.response.data.message;
        } else if (!err.response) {
          message =
            'Koneksi backend gagal. Periksa server port 5000.';
        }
      }

      setToast({ message, type: 'error' });
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
            Lupa Password?
          </h1>

          <p className="text-xs text-kage-mist font-sans">
            Masukkan email akun Kagemaya.id Anda.
            Kami akan mengirimkan tautan untuk
            mengatur ulang password.
          </p>
        </div>

        {!submitted ? (
          /* Form Forgot Password */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="forgot-email"
                className="text-xs font-medium text-kage-mist block"
              >
                Alamat Email
              </label>

              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-kage-mist-dim absolute left-3 pointer-events-none" />

                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-kage-yoru-light border border-kage-border rounded px-3 py-2.5 pl-9 text-xs text-kage-washi placeholder:text-kage-mist-dim focus:outline-none focus:border-kage-gold transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-60 text-white text-xs font-semibold tracking-wide transition flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <span>Kirim Link Reset Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Konfirmasi tanpa mengungkap status akun */
          <div
            role="status"
            className="space-y-4 text-center"
          >
            <div className="border border-kage-border bg-kage-yoru-light rounded p-4">
              <p className="text-sm text-kage-washi font-medium">
                Periksa Email Anda
              </p>

              <p className="text-xs text-kage-mist mt-2 leading-relaxed">
                Jika email terdaftar, tautan reset
                password akan dikirim. Silakan periksa
                Inbox atau folder Spam.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-xs text-kage-gold hover:underline"
            >
              Gunakan alamat email lain
            </button>
          </div>
        )}

        {/* Kembali ke Login */}
        <div className="text-center pt-2 border-t border-kage-border/60">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs text-kage-gold hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
