'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { formatDate, getImageUrl } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import {
  MessageSquare,
  Pin,
  Send,
  CornerDownRight,
  ShieldCheck,
  User,
  Loader2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export interface DiscussionAuthor {
  id: string;
  name: string;
  role: string;
  profile_picture?: string | null;
}

export interface DiscussionReply {
  id: string;
  event_id: string;
  parent_id: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  is_organizer: boolean;
  user: DiscussionAuthor;
}

export interface DiscussionItem {
  id: string;
  event_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  is_organizer: boolean;
  user: DiscussionAuthor;
  replies: DiscussionReply[];
}

interface EventQAWallProps {
  eventId: string;
  organizerId?: string;
}

export default function EventQAWall({ eventId, organizerId }: EventQAWallProps) {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionInput, setQuestionInput] = useState('');
  const [replyInput, setReplyInput] = useState<{ [discId: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isOrganizer = !!user && !!organizerId && user.id === organizerId;

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${eventId}/discussions`);
      if (res.data?.data) {
        setDiscussions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadDiscussions();
    }
  }, [eventId]);

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!questionInput.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/events/${eventId}/discussions`, {
        content: questionInput.trim(),
      });
      if (res.data?.data) {
        setDiscussions((prev) => [res.data.data, ...prev]);
        setQuestionInput('');
        setToast({ message: 'Pertanyaan Anda berhasil diajukan!', type: 'success' });
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Gagal mengirim pertanyaan.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostReply = async (discussionId: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const content = replyInput[discussionId];
    if (!content || !content.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/events/${eventId}/discussions`, {
        content: content.trim(),
        parent_id: discussionId,
      });

      if (res.data?.data) {
        const newReply = res.data.data;
        setDiscussions((prev) =>
          prev.map((disc) => {
            if (disc.id === discussionId) {
              return {
                ...disc,
                replies: [...(disc.replies || []), newReply],
              };
            }
            return disc;
          })
        );
        setReplyInput((prev) => ({ ...prev, [discussionId]: '' }));
        setActiveReplyId(null);
        setToast({ message: 'Balasan berhasil dikirim!', type: 'success' });
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Gagal mengirim balasan.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (discussionId: string) => {
    if (!isOrganizer) return;
    try {
      setPinningId(discussionId);
      const res = await api.patch(`/discussions/${discussionId}/pin`);
      const updated = res.data?.data;
      if (updated) {
        setDiscussions((prev) =>
          prev
            .map((disc) => {
              if (disc.id === discussionId) {
                return { ...disc, is_pinned: updated.is_pinned };
              }
              return disc;
            })
            .sort((a, b) => {
              if (a.is_pinned === b.is_pinned) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              }
              return a.is_pinned ? -1 : 1;
            })
        );
        setToast({
          message: updated.is_pinned
            ? 'Diskusi disematkan sebagai Pinned Q&A.'
            : 'Sematkan diskusi dilepas.',
          type: 'success',
        });
      }
    } catch (err: any) {
      setToast({
        message: err.response?.data?.message || 'Gagal menyematkan diskusi.',
        type: 'error',
      });
    } finally {
      setPinningId(null);
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-kage-border" id="diskusi">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-kage-gold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            <span>Forum Interaktif</span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl text-kage-washi font-medium">
            Tanya Jawab &amp; Diskusi Komunitas
          </h3>
          <p className="text-xs text-kage-mist">
            Ajukan pertanyaan langsung kepada Organizer atau diskusikan detail penayangan bersama penonton lainnya.
          </p>
        </div>

        <span className="text-xs text-kage-mist-dim px-3 py-1 rounded-full bg-kage-yoru border border-kage-border self-start font-mono">
          {discussions.length} Diskusi
        </span>
      </div>

      {/* Input Pertanyaan Utama */}
      <form
        onSubmit={handlePostQuestion}
        className="p-4 sm:p-5 rounded-lg bg-kage-yoru border border-kage-border shadow-md space-y-3"
      >
        <div className="flex items-center gap-2 text-xs text-kage-mist">
          <HelpCircle className="w-4 h-4 text-kage-gold" />
          <span>Tanyakan sesuatu seputar jadwal, lokasi, atau fasilitas film:</span>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder={
              user
                ? 'Tulis pertanyaan Anda di sini... (cth: Apakah tersedia subtitel bahasa Indonesia?)'
                : 'Silakan login terlebih dahulu untuk mengajukan pertanyaan...'
            }
            disabled={!user || submitting}
            className="w-full bg-kage-black/80 border border-kage-border focus:border-kage-gold rounded-lg p-3 text-xs sm:text-sm text-kage-washi placeholder-kage-mist-dim resize-none transition outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-kage-mist-dim hidden sm:inline">
            Jawaban resmi dari Organizer akan ditandai dengan badge khusus.
          </span>
          {user ? (
            <button
              type="submit"
              disabled={submitting || !questionInput.trim()}
              className="px-5 py-2 rounded bg-kage-red hover:bg-kage-vermilion disabled:opacity-50 text-white text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow-sm ml-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <span>Kirim Pertanyaan</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          ) : (
            <a
              href="/login"
              className="px-5 py-2 rounded border border-kage-gold text-kage-gold hover:bg-kage-gold/10 text-xs font-semibold tracking-wider uppercase transition ml-auto"
            >
              Masuk untuk Bertanya
            </a>
          )}
        </div>
      </form>

      {/* Discussion List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 text-kage-gold animate-spin" />
            <p className="text-xs text-kage-mist">Memuat ruang diskusi...</p>
          </div>
        ) : discussions.length > 0 ? (
          discussions.map((disc) => (
            <article
              key={disc.id}
              className={`rounded-lg p-4 sm:p-5 border transition-all space-y-4 ${
                disc.is_pinned
                  ? 'bg-kage-yoru border-kage-gold/60 shadow-lg shadow-kage-gold/5'
                  : 'bg-kage-yoru border-kage-border'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-kage-yoru-light border border-kage-border flex items-center justify-center overflow-hidden shrink-0">
                    {disc.user?.profile_picture ? (
                      <img
                        src={getImageUrl(disc.user.profile_picture)}
                        alt={disc.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif text-xs text-kage-gold font-bold">
                        {disc.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-kage-washi">
                        {disc.user?.name}
                      </span>
                      {disc.is_organizer && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-kage-gold text-kage-black font-sans">
                          Organizer
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-kage-mist-dim block">
                      {formatDate(disc.created_at)}
                    </span>
                  </div>
                </div>

                {/* Pin Badge / Pin Toggle Action */}
                <div className="flex items-center gap-2">
                  {disc.is_pinned && (
                    <span className="px-2.5 py-1 rounded bg-kage-gold/15 text-kage-gold border border-kage-gold/30 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                      <Pin className="w-3 h-3 fill-kage-gold" />
                      <span>Pinned Answer</span>
                    </span>
                  )}
                  {isOrganizer && (
                    <button
                      type="button"
                      onClick={() => handleTogglePin(disc.id)}
                      disabled={pinningId === disc.id}
                      title={disc.is_pinned ? 'Lepas Sematkan' : 'Sematkan Pertanyaan/Jawaban Ini'}
                      className={`p-1.5 rounded border text-xs transition ${
                        disc.is_pinned
                          ? 'border-kage-gold text-kage-gold hover:bg-kage-gold/20'
                          : 'border-kage-border text-kage-mist hover:text-kage-gold hover:border-kage-gold'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${disc.is_pinned ? 'fill-kage-gold' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Body */}
              <p className="text-xs sm:text-sm text-kage-washi leading-relaxed whitespace-pre-line pl-11">
                {disc.content}
              </p>

              {/* Action: Balas */}
              <div className="flex items-center justify-between pt-2 border-t border-kage-border/40 pl-11">
                <button
                  type="button"
                  onClick={() =>
                    setActiveReplyId(activeReplyId === disc.id ? null : disc.id)
                  }
                  className="text-xs text-kage-mist hover:text-kage-gold flex items-center gap-1.5 transition font-medium"
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>
                    Balas {disc.replies?.length > 0 ? `(${disc.replies.length})` : ''}
                  </span>
                </button>
              </div>

              {/* Nested Replies List */}
              {disc.replies && disc.replies.length > 0 && (
                <div className="space-y-3 pl-8 sm:pl-11 pt-2">
                  {disc.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-3.5 rounded-lg border space-y-2 ${
                        reply.is_organizer
                          ? 'bg-kage-yoru-light border-kage-gold/40'
                          : 'bg-kage-black/60 border-kage-border/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-kage-yoru border border-kage-border flex items-center justify-center overflow-hidden shrink-0">
                            {reply.user?.profile_picture ? (
                              <img
                                src={getImageUrl(reply.user.profile_picture)}
                                alt={reply.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-serif text-[10px] text-kage-gold font-bold">
                                {reply.user?.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-kage-washi">
                            {reply.user?.name}
                          </span>
                          {reply.is_organizer && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-kage-gold text-kage-black">
                              Organizer
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-kage-mist-dim font-sans">
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-kage-mist leading-relaxed pl-8">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {activeReplyId === disc.id && (
                <div className="pl-8 sm:pl-11 pt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <textarea
                      rows={2}
                      value={replyInput[disc.id] || ''}
                      onChange={(e) =>
                        setReplyInput((prev) => ({
                          ...prev,
                          [disc.id]: e.target.value,
                        }))
                      }
                      placeholder={
                        isOrganizer
                          ? 'Tulis tanggapan resmi sebagai Organizer...'
                          : 'Tulis balasan Anda...'
                      }
                      className="flex-1 bg-kage-black border border-kage-border focus:border-kage-gold rounded-lg p-2.5 text-xs text-kage-washi placeholder-kage-mist-dim resize-none outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => handlePostReply(disc.id)}
                      disabled={submitting || !replyInput[disc.id]?.trim()}
                      className="px-4 py-2.5 rounded bg-kage-gold hover:bg-yellow-500 disabled:opacity-40 text-kage-black font-semibold text-xs transition flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim</span>
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-kage-border rounded-lg p-6 bg-kage-yoru/30 space-y-2">
            <MessageSquare className="w-8 h-8 text-kage-mist-dim mx-auto" />
            <h4 className="font-serif text-sm text-kage-washi font-medium">
              Belum Ada Pertanyaan
            </h4>
            <p className="text-xs text-kage-mist max-w-sm mx-auto">
              Jadilah yang pertama mengajukan pertanyaan mengenai film atau agenda penayangan ini kepada Organizer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
