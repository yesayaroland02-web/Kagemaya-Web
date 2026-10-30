
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

interface EventData {
  id: string;
  title: string;
  end_date: string;
}

interface Transaction {
  id: string;
  status: string;
  event: EventData;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customer: {
    id: string;
    name: string;
  };
}

export default function UserReviewsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [existingReview, setExistingReview] =
    useState<Review | null>(null);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lindungi halaman dari pengunjung yang belum login.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/user/reviews');
    }
  }, [authLoading, user, router]);

  // Ambil semua transaksi DONE untuk mencari event selesai.
  useEffect(() => {
    if (authLoading || !user || user.role !== 'CUSTOMER') {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadEvents() {
      try {
        setLoading(true);
        setError('');

        const uniqueEvents = new Map<string, EventData>();
        let page = 1;
        let totalPages = 1;

        do {
          const response = await api.get(
            '/transactions/my-transactions',
            {
              params: {
                status: 'DONE',
                page,
                limit: 50,
              },
            }
          );

          const transactions: Transaction[] =
            response.data.data || [];

          for (const tx of transactions) {
            if (
              tx.status === 'DONE' &&
              tx.event &&
              new Date(tx.event.end_date).getTime() <= Date.now()
            ) {
              uniqueEvents.set(tx.event.id, tx.event);
            }
          }

          totalPages = response.data.pagination?.totalPages ?? 1;
          page++;
        } while (page <= totalPages);

        if (active) {
          const result = Array.from(uniqueEvents.values());
          setEvents(result);
          setSelectedId(result[0]?.id || '');
        }
      } catch {
        if (active) {
          setError('Gagal mengambil riwayat event.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [authLoading, user?.id, user?.role]);

  // Periksa review yang pernah diberikan.
  useEffect(() => {
    if (!selectedId || !user) return;

    let active = true;

    async function loadReview() {
      setChecking(true);
      setCheckFailed(false);
      setExistingReview(null);

      try {
        let page = 1;
        let totalPages = 1;
        let found: Review | null = null;

        do {
          const response = await api.get(
            `/events/${selectedId}/reviews`,
            { params: { page, limit: 50 } }
          );

          const reviews: Review[] =
            response.data.data?.reviews || [];

          found =
            reviews.find(
              (review) => review.customer?.id === user!.id
            ) || null;

          totalPages = response.data.pagination?.totalPages ?? 1;
          page++;
        } while (!found && page <= totalPages);

        if (active) setExistingReview(found);
      } catch {
        if (active) setCheckFailed(true);
      } finally {
        if (active) setChecking(false);
      }
    }

    loadReview();

    return () => {
      active = false;
    };
  }, [selectedId, user?.id]);

  function selectEvent(id: string) {
    setSelectedId(id);
    setRating(0);
    setComment('');
    setError('');
    setSuccess('');
  }

  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !selectedId ||
      rating < 1 ||
      rating > 5 ||
      checking ||
      checkFailed ||
      existingReview ||
      submitting
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await api.post(
        `/events/${selectedId}/reviews`,
        {
          rating,
          comment: comment.trim(),
        }
      );

      setExistingReview(response.data.data);
      setSuccess('Terima kasih! Ulasan berhasil dikirim.');
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
      };

      setError(
        axiosError.response?.data?.message ||
          'Gagal mengirim ulasan.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || (!loading && !user)) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-kage-gold" />
      </div>
    );
  }

  if (user?.role !== 'CUSTOMER') {
    return (
      <main className="max-w-5xl mx-auto p-10 text-kage-washi">
        Halaman ulasan hanya tersedia untuk Customer.
      </main>
    );
  }

  const selectedEvent = events.find(
    (event) => event.id === selectedId
  );

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-kage-washi mb-3">
          Ulasan Event Saya
        </h1>
        <p className="text-kage-mist">
          Berikan penilaian untuk event yang telah selesai.
        </p>
      </header>

      {error && (
        <div role="alert" className="mb-5 p-4 border border-red-500 rounded text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mb-5 p-4 border border-green-600 rounded text-green-400">
          {success}
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-kage-yoru border border-kage-border rounded-lg p-8 text-center">
          <MessageSquare className="w-10 h-10 text-kage-gold mx-auto mb-4" />
          <p className="text-kage-washi">
            Belum ada event selesai yang dapat diulas.
          </p>
          <p className="text-kage-mist text-sm mt-2">
            Event akan tersedia setelah tanggal selesai dan
            pembayaran transaksi dikonfirmasi.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <aside className="space-y-3">
            <h2 className="text-kage-gold font-semibold">
              Event yang Telah Selesai
            </h2>

            {events.map((event) => (
              <button
                type="button"
                key={event.id}
                onClick={() => selectEvent(event.id)}
                className={`w-full text-left p-4 rounded-lg border transition ${
                  selectedId === event.id
                    ? 'border-kage-gold bg-kage-yoru-light'
                    : 'border-kage-border bg-kage-yoru'
                }`}
              >
                <span className="block text-kage-washi font-medium text-sm">
                  {event.title}
                </span>
                <span className="block text-kage-mist text-xs mt-2">
                  Selesai: {new Date(event.end_date).toLocaleDateString('id-ID')}
                </span>
              </button>
            ))}
          </aside>

          <section className="md:col-span-2 bg-kage-yoru border border-kage-border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="font-serif text-xl text-kage-washi">
                {selectedEvent?.title}
              </h2>
              <p className="text-kage-mist text-sm mt-2">
                Bagikan pengalaman Anda menghadiri event ini.
              </p>
            </div>

            {checking ? (
              <p className="text-kage-mist">
                Memeriksa riwayat ulasan...
              </p>
            ) : checkFailed ? (
              <p className="text-red-400">
                Gagal memeriksa ulasan. Pilih ulang event untuk mencoba lagi.
              </p>
            ) : existingReview ? (
              <div className="space-y-4">
                <p className="text-green-400">
                  Anda sudah memberikan ulasan.
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${
                        star <= existingReview.rating
                          ? 'text-kage-gold fill-current'
                          : 'text-kage-mist'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-kage-washi">
                  {existingReview.comment || 'Tanpa komentar.'}
                </p>
              </div>
            ) : (
              <form onSubmit={submitReview} className="space-y-6">
                <div>
                  <label className="block text-kage-washi mb-3">
                    Rating Event
                  </label>

                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} bintang`}
                        aria-pressed={rating === star}
                        onClick={() => setRating(star)}
                        className="focus-visible:outline focus-visible:outline-kage-gold rounded"
                      >
                        <Star
                          className={`w-9 h-9 transition ${
                            star <= rating
                              ? 'text-kage-gold fill-current'
                              : 'text-kage-mist hover:text-kage-gold'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <p className="text-kage-mist text-sm mt-2">
                    {rating === 0
                      ? 'Pilih 1 sampai 5 bintang'
                      : `Rating: ${rating} dari 5 bintang`}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-kage-washi mb-3"
                  >
                    Ulasan Anda
                  </label>

                  <textarea
                    id="review-comment"
                    rows={5}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tuliskan pengalaman Anda mengikuti event..."
                    className="w-full p-4 bg-kage-black border border-kage-border rounded-lg text-kage-washi focus:outline-none focus:border-kage-gold"
                  />

                  <p className="text-kage-mist text-xs text-right mt-1">
                    {comment.length}/1000 karakter
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={rating === 0 || submitting}
                  className="px-6 py-3 bg-kage-red hover:bg-kage-vermilion text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
