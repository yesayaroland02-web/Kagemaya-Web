'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, X, Send, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

interface ReviewModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onSuccess: (eventId: string) => void;
}

const STAR_LABELS: Record<number, string> = {
  1: 'Sangat Buruk',
  2: 'Buruk',
  3: 'Cukup',
  4: 'Bagus',
  5: 'Luar Biasa!',
};

export default function ReviewModal({
  eventId,
  eventTitle,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tutup modal saat menekan Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    },
    [submitting, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/events/${eventId}/reviews`, {
        rating,
        comment: comment.trim() || null,
      });
      onSuccess(eventId);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message || 'Gagal mengirim ulasan. Coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeRating = hovered || rating;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-kage-yoru border border-kage-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-kage-border">
          <div>
            <h2
              id="review-modal-title"
              className="font-serif text-xl text-kage-washi leading-snug"
            >
              Beri Ulasan
            </h2>
            <p className="text-kage-mist text-sm mt-1 line-clamp-1" title={eventTitle}>
              {eventTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup"
            className="p-1.5 rounded-lg text-kage-mist hover:text-kage-washi hover:bg-kage-border/40 transition disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          
          {/* Star Rating */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-kage-washi">
              Rating Keseluruhan <span className="text-kage-error">*</span>
            </label>
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label="Pilih rating bintang"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} bintang — ${STAR_LABELS[star]}`}
                  aria-pressed={rating === star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="focus-visible:outline-2 focus-visible:outline-kage-gold rounded transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-10 h-10 transition-colors duration-150 ${
                      star <= activeRating
                        ? 'text-kage-gold fill-kage-gold'
                        : 'text-kage-mist'
                    }`}
                  />
                </button>
              ))}
            </div>
            {activeRating > 0 && (
              <p className="text-kage-gold text-sm font-medium">
                {STAR_LABELS[activeRating]}
              </p>
            )}
            {activeRating === 0 && (
              <p className="text-kage-mist text-sm">
                Pilih 1 sampai 5 bintang
              </p>
            )}
          </div>

          {/* Komentar */}
          <div className="space-y-2">
            <label
              htmlFor="review-modal-comment"
              className="block text-sm font-medium text-kage-washi"
            >
              Ulasan Anda{' '}
              <span className="text-kage-mist font-normal">(opsional)</span>
            </label>
            <textarea
              id="review-modal-comment"
              rows={4}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda mengikuti acara ini..."
              disabled={submitting}
              className="w-full px-4 py-3 bg-kage-black border border-kage-border rounded-lg text-kage-washi placeholder:text-kage-mist-dim text-sm focus:outline-none focus:border-kage-gold transition resize-none disabled:opacity-50"
            />
            <p className="text-right text-xs text-kage-mist">
              {comment.length}/1000
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="px-4 py-3 bg-kage-error/10 border border-kage-error/40 rounded-lg text-kage-error text-sm"
            >
              {error}
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg text-sm text-kage-mist border border-kage-border hover:text-kage-washi hover:border-kage-mist-dim transition disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-kage-gold hover:bg-yellow-400 text-kage-black transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Ulasan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
