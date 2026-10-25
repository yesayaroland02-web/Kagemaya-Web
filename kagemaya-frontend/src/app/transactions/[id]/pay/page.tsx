'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { formatRupiah, formatDateTime, getImageUrl } from '@/lib/utils';
import Toast from '@/components/ui/Toast';
import {
  Clock,
  Copy,
  Check,
  UploadCloud,
  FileImage,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Building2,
  QrCode,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface TransactionDetail {
  id: string;
  total_price: number;
  voucher_discount: number;
  coupon_discount: number;
  points_used: number;
  final_price: number;
  status: 'WAITING_PAYMENT' | 'WAITING_CONFIRMATION' | 'DONE' | 'REJECTED' | 'EXPIRED' | 'CANCELED';
  payment_deadline: string;
  payment_proof_url?: string | null;
  event: {
    id: string;
    title: string;
    banner_url?: string | null;
    start_date: string;
    city: string;
    location: string;
  };
  transaction_items: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    ticket_type: {
      name: string;
    };
  }[];
}

export default function PaymentProofPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Redirect jika belum login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/transactions/${transactionId}/pay`);
    }
  }, [user, authLoading, router, transactionId]);

  // 2. Load Transaction Detail
  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true);
        const res = await api.get(`/transactions/${transactionId}`);
        if (res.data?.data) {
          setTransaction(res.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load transaction:', err);
        setToast({ message: 'Transaksi tidak ditemukan atau akses ditolak.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  // 3. Countdown Timer (2 Jam dari payment_deadline)
  useEffect(() => {
    if (!transaction || transaction.status !== 'WAITING_PAYMENT') return;

    const deadline = new Date(transaction.payment_deadline).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [transaction]);

  // Helper Copy Text
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Drag & Drop File
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setToast({ message: 'Format gambar harus berupa JPG, PNG, atau WEBP.', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Ukuran file maksimal 5 MB.', type: 'error' });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isExpired || transaction?.status !== 'WAITING_PAYMENT') return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Submit Upload Bukti Bayar
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setToast({ message: 'Pilih file bukti pembayaran terlebih dahulu.', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('payment_proof', selectedFile);

      const res = await api.post(`/transactions/${transactionId}/payment-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setToast({
          message: 'Bukti pembayaran berhasil diunggah! Menunggu konfirmasi admin.',
          type: 'success',
        });
        setTransaction(res.data.data);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-kage-gold animate-spin" />
        <p className="text-xs text-kage-mist">Memuat instruksi pembayaran...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl text-kage-washi">Transaksi Tidak Ditemukan</h2>
        <Link href="/user/transactions" className="text-xs text-kage-gold hover:underline">
          Lihat Riwayat Transaksi Anda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <Link
          href="/user/transactions"
          className="inline-flex items-center gap-1.5 text-xs text-kage-mist hover:text-kage-gold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Riwayat Transaksi</span>
        </Link>
        <span className="font-mono text-[11px] text-kage-mist-dim">
          ID: {transaction.id}
        </span>
      </div>

      {/* ── 1. TIMER COUNTDOWN 2 JAM ────────────────────────── */}
      {transaction.status === 'WAITING_PAYMENT' && (
        <div
          className={`p-5 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-4 transition shadow-lg ${
            isExpired
              ? 'bg-kage-error/10 border-kage-error/40 text-kage-error'
              : 'bg-kage-gold/10 border-kage-gold/30 text-kage-gold'
          }`}
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className={`p-2.5 rounded-full ${isExpired ? 'bg-kage-error/20' : 'bg-kage-gold/20'}`}>
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider">
                {isExpired ? 'Batas Waktu Pembayaran Habis' : 'Selesaikan Pembayaran Dalam Waktu:'}
              </h3>
              <p className="text-[11px] text-kage-mist mt-0.5">
                {isExpired
                  ? 'Transaksi ini telah kedaluwarsa. Kuota tiket dan poin telah dikembalikan.'
                  : `Batas akhir transfer: ${formatDateTime(transaction.payment_deadline)}`}
              </p>
            </div>
          </div>

          {!isExpired && timeLeft && (
            <div className="flex items-center gap-1.5 font-mono text-xl sm:text-2xl font-bold bg-kage-black/60 px-4 py-2 rounded border border-kage-border">
              <span className="w-10 text-center">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span>:</span>
              <span className="w-10 text-center">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span className="w-10 text-center text-kage-red">{String(timeLeft.seconds).padStart(2, '0')}</span>
            </div>
          )}
        </div>
      )}

      {/* ── JIKA STATUS SUDAH WAITING_CONFIRMATION / LAINNYA ── */}
      {transaction.status === 'WAITING_CONFIRMATION' && (
        <div className="p-5 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Bukti Bayar Sedang Diverifikasi Admin
            </h4>
            <p className="text-xs text-kage-mist leading-relaxed">
              Terima kasih! Bukti transfer Anda telah kami terima. Penyelenggara/Admin akan memverifikasi dalam waktu maksimal 1x24 jam.
            </p>
          </div>
        </div>
      )}

      {/* ── 2. RINCIAN NOMINAL & REKENING PEMBAYARAN ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box Tagihan Persis */}
        <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-4">
          <span className="text-[11px] uppercase tracking-wider text-kage-mist-dim block">
            Total Tagihan Transfer
          </span>
          <div className="flex items-baseline justify-between border-b border-kage-border pb-3">
            <span className="font-serif text-3xl font-bold text-kage-gold">
              {formatRupiah(transaction.final_price)}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(String(transaction.final_price), 'amount')}
              className="text-xs px-2.5 py-1 rounded bg-kage-yoru-light border border-kage-border text-kage-mist hover:text-kage-washi transition flex items-center gap-1"
            >
              {copiedField === 'amount' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-kage-success" />
                  <span className="text-kage-success">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Nominal</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 text-xs text-kage-mist">
            <div className="flex justify-between">
              <span>Event:</span>
              <span className="text-kage-washi font-medium truncate max-w-[200px]">
                {transaction.event.title}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tiket:</span>
              <span className="text-kage-washi font-medium">
                {transaction.transaction_items.map((i) => `${i.ticket_type.name} (${i.quantity}x)`).join(', ')}
              </span>
            </div>
            {transaction.points_used > 0 && (
              <div className="flex justify-between text-kage-gold">
                <span>Potongan Poin:</span>
                <span>- {formatRupiah(transaction.points_used)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Box Rekening Tujuan */}
        <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-4">
          <span className="text-[11px] uppercase tracking-wider text-kage-mist-dim block">
            Rekening Tujuan Transfer
          </span>

          <div className="space-y-3">
            {/* Rekening BCA */}
            <div className="p-3 rounded bg-kage-yoru-light border border-kage-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-kage-washi uppercase block">
                  Bank Central Asia (BCA)
                </span>
                <span className="font-mono text-sm font-semibold text-kage-gold block">
                  8045 1928 3719
                </span>
                <span className="text-[10px] text-kage-mist-dim block">
                  a.n. PT Kagemaya Sinema Interaktif
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('804519283719', 'bca')}
                className="p-2 rounded bg-kage-yoru border border-kage-border hover:text-kage-gold transition"
              >
                {copiedField === 'bca' ? (
                  <Check className="w-4 h-4 text-kage-success" />
                ) : (
                  <Copy className="w-4 h-4 text-kage-mist" />
                )}
              </button>
            </div>

            {/* Rekening Mandiri */}
            <div className="p-3 rounded bg-kage-yoru-light border border-kage-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-kage-washi uppercase block">
                  Bank Mandiri
                </span>
                <span className="font-mono text-sm font-semibold text-kage-gold block">
                  137 00 2948 1029
                </span>
                <span className="text-[10px] text-kage-mist-dim block">
                  a.n. PT Kagemaya Sinema Interaktif
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('1370029481029', 'mandiri')}
                className="p-2 rounded bg-kage-yoru border border-kage-border hover:text-kage-gold transition"
              >
                {copiedField === 'mandiri' ? (
                  <Check className="w-4 h-4 text-kage-success" />
                ) : (
                  <Copy className="w-4 h-4 text-kage-mist" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. FORM DROPZONE UPLOAD BUKTI TRANSFER ──────────── */}
      <div className="p-6 rounded-lg bg-kage-yoru border border-kage-border space-y-5">
        <div className="border-b border-kage-border pb-3">
          <h3 className="text-xs font-semibold text-kage-gold uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-4 h-4" />
            <span>Unggah Bukti Pembayaran / Struk Transfer</span>
          </h3>
          <p className="text-xs text-kage-mist mt-1">
            Unggah foto atau tangkapan layar (screenshot) bukti transfer perbankan yang jelas.
          </p>
        </div>

        {transaction.payment_proof_url ? (
          <div className="space-y-4">
            <div className="p-4 rounded bg-kage-yoru-light border border-kage-border flex items-center gap-4">
              <div className="w-20 h-20 rounded overflow-hidden bg-kage-black shrink-0 border border-kage-border">
                <img
                  src={getImageUrl(transaction.payment_proof_url)}
                  alt="Bukti Transfer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-kage-washi block">
                  Bukti bayar telah berhasil diunggah
                </span>
                <a
                  href={getImageUrl(transaction.payment_proof_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-kage-gold hover:underline inline-block"
                >
                  Lihat Gambar Penuh &rarr;
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dropzone Container */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => {
                if (!isExpired && transaction.status === 'WAITING_PAYMENT') {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                isExpired || transaction.status !== 'WAITING_PAYMENT'
                  ? 'border-kage-border/40 bg-kage-black/40 opacity-50 cursor-not-allowed'
                  : 'border-kage-border hover:border-kage-gold/60 bg-kage-yoru-light'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isExpired || transaction.status !== 'WAITING_PAYMENT'}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <div className="w-32 h-32 mx-auto rounded overflow-hidden border border-kage-gold/40 shadow-md">
                    <img
                      src={previewUrl}
                      alt="Preview Bukti"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-kage-washi">
                    {selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(0)} KB)
                  </p>
                  <p className="text-[11px] text-kage-gold">
                    Klik untuk mengganti gambar bukti transfer
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-kage-yoru border border-kage-border">
                    <UploadCloud className="w-6 h-6 text-kage-gold" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-kage-washi">
                      Tarik & Letakkan file gambar di sini, atau <span className="text-kage-gold">Pilih File</span>
                    </p>
                    <p className="text-[11px] text-kage-mist-dim">
                      Mendukung format JPG, PNG, atau WEBP (Maksimal 5 MB)
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Tombol Kirim Bukti */}
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={uploading || !selectedFile || isExpired || transaction.status !== 'WAITING_PAYMENT'}
              className="w-full py-3.5 rounded bg-kage-gold hover:bg-yellow-500 disabled:opacity-50 text-kage-black font-semibold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah ke Cloudinary...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kirim Bukti Pembayaran</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
