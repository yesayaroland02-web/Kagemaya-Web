'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Sparkles,
  ShieldCheck,
  Ticket as TicketIcon,
  Share2,
  X,
} from 'lucide-react';
import { TicketData } from '@/types/ticket';
import { formatRupiah, getImageUrl } from '@/lib/utils';

interface TicketDisplayProps {
  ticket: TicketData;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function TicketDisplay({
  ticket,
  onClose,
  showCloseButton = false,
}: TicketDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Generate unique formatted ticket reference code (e.g. KGM-TKT-A1B2C3D4)
  const cleanId = ticket.id.replace(/-/g, '').toUpperCase();
  const ticketCode = `KGM-TKT-${cleanId.slice(0, 8)}`;

  const startDate = new Date(ticket.event.start_date);
  const formattedDay = startDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime =
    startDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

  const totalTickets =
    ticket.transaction_items?.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    ) || 1;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `E-Tiket: ${ticket.event.title}`,
          text: `E-Tiket Resmi Kagemaya.id untuk ${ticket.event.title} (${ticketCode})`,
          url: window.location.href,
        });
      } catch {
        // user cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── TOP ACTION & CONTROL TOOLBAR (Always accessible, hidden on print) ── */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1 print:hidden">
        {/* Verification Status Pill */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-kage-success/15 text-kage-success border border-kage-success/30 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Lunas &amp; Terverifikasi EO</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="px-2.5 py-1.5 rounded-lg border border-kage-border hover:border-kage-gold text-kage-mist hover:text-kage-washi text-xs font-medium flex items-center gap-1 transition bg-kage-yoru/80"
            title="Bagikan Tautan Tiket"
          >
            {shared ? (
              <>
                <Check className="w-3.5 h-3.5 text-kage-success" />
                <span className="text-kage-success hidden sm:inline">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bagikan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-kage-gold hover:bg-yellow-500 text-kage-black text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shrink-0"
            title="Cetak atau Unduh PDF E-Tiket"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>

          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-kage-border hover:border-kage-gold/60 bg-kage-yoru hover:bg-kage-yoru-light text-kage-mist hover:text-white transition shrink-0"
              title="Tutup Tiket (Esc)"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── TICKET CARD CONTAINER (Printable) ── */}
      <div
        id="kagemaya-ticket-printable"
        className="relative bg-kage-yoru border border-kage-gold/30 rounded-2xl shadow-2xl overflow-hidden print:border print:border-black print:bg-white print:text-black print:shadow-none"
      >
        {/* Decorative Golden Cinema Header Stripe */}
        <div className="h-1.5 bg-gradient-to-r from-kage-red via-kage-gold to-kage-vermilion print:bg-black" />

        {/* ── 1. TICKET HEADER (BRAND & CODE) ── */}
        <div className="p-4 sm:p-5 pb-3.5 border-b border-kage-border/70 flex items-center justify-between gap-3 print:border-gray-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded bg-kage-red flex items-center justify-center text-white font-serif font-bold text-base shadow-sm shrink-0 print:bg-black">
              影
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-serif tracking-widest text-sm font-bold text-kage-washi print:text-black">
                  KAGEMAYA<span className="text-kage-gold text-xs ml-0.5 print:text-black">.ID</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-kage-yoru-light text-kage-gold border border-kage-gold/30 print:bg-gray-100 print:text-black">
                  E-TIKET
                </span>
              </div>
              <p className="text-[10px] text-kage-mist-dim tracking-wider uppercase font-sans truncate print:text-gray-600">
                Sinema 4D &amp; Kreatif Imersif
              </p>
            </div>
          </div>

          {/* Ticket Reference Code */}
          <div className="text-right shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-kage-mist-dim block print:text-gray-500">
              Kode Tiket
            </span>
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <span className="font-mono text-xs sm:text-sm font-bold text-kage-gold tracking-wider print:text-black">
                {ticketCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 rounded hover:bg-kage-yoru-light text-kage-mist hover:text-kage-gold transition print:hidden"
                title="Salin Kode Tiket"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-kage-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. EVENT MAIN INFORMATION (RESPONSIVE) ── */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Banner Thumbnail (Clean 16:9 on both mobile and desktop) */}
            <div className="w-full sm:w-44 h-32 sm:h-28 rounded-lg bg-kage-black border border-kage-border overflow-hidden shrink-0 relative shadow-inner print:border-gray-400">
              {ticket.event.banner_url ? (
                <img
                  src={getImageUrl(ticket.event.banner_url)}
                  alt={ticket.event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-kage-gold gap-1">
                  <Sparkles className="w-6 h-6 opacity-60" />
                  <span className="text-[9px] uppercase tracking-wider text-kage-mist font-medium">
                    Sinema 4D
                  </span>
                </div>
              )}
            </div>

            {/* Event Title & Metadata */}
            <div className="flex-1 space-y-2.5 min-w-0 w-full">
              <div>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-kage-gold bg-kage-gold/10 px-2 py-0.5 rounded border border-kage-gold/20 mb-1 print:bg-gray-100 print:text-black">
                  {ticket.event.category?.name || 'Pertunjukan Sinematik'}
                </span>
                <h1 className="font-serif text-base sm:text-lg font-bold text-kage-washi leading-snug break-words print:text-black">
                  {ticket.event.title}
                </h1>
              </div>

              {/* Event Details Grid (Compact, doesn't overflow) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-kage-mist print:text-gray-700 pt-0.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-kage-gold shrink-0 print:text-black" />
                  <div className="min-w-0">
                    <span className="text-[9px] text-kage-mist-dim block uppercase print:text-gray-500">
                      Tanggal Acara
                    </span>
                    <span className="font-medium text-kage-washi truncate block print:text-black text-[11px] sm:text-xs">
                      {formattedDay}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-kage-gold shrink-0 print:text-black" />
                  <div className="min-w-0">
                    <span className="text-[9px] text-kage-mist-dim block uppercase print:text-gray-500">
                      Waktu Mulai
                    </span>
                    <span className="font-medium text-kage-washi truncate block print:text-black text-[11px] sm:text-xs">
                      {formattedTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-kage-gold shrink-0 print:text-black" />
                  <div className="min-w-0">
                    <span className="text-[9px] text-kage-mist-dim block uppercase print:text-gray-500">
                      Lokasi &amp; Tempat
                    </span>
                    <span className="font-medium text-kage-washi break-words block print:text-black text-[11px] sm:text-xs">
                      {ticket.event.location}, {ticket.event.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. PERFORATED CUTOUT SEPARATOR (STUB NOTCH) ── */}
        <div className="relative flex items-center justify-between my-1">
          {/* Left Notch Circle */}
          <div className="w-3.5 h-7 rounded-r-full bg-[#0B0B0D] border-y border-r border-kage-gold/30 shrink-0 print:hidden" />
          {/* Golden Perforated Dashed Line */}
          <div className="flex-1 border-t-2 border-dashed border-kage-border/80 mx-2 print:border-gray-400" />
          {/* Right Notch Circle */}
          <div className="w-3.5 h-7 rounded-l-full bg-[#0B0B0D] border-y border-l border-kage-gold/30 shrink-0 print:hidden" />
        </div>

        {/* ── 4. TICKET STUB / BREAKDOWN & ATTENDEE ── */}
        <div className="p-4 sm:p-5 bg-kage-black/40 print:bg-white space-y-4">
          {/* Attendee & Organizer Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-kage-border/60 print:border-gray-300">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-kage-mist-dim block print:text-gray-500">
                Pemegang Tiket (Pembeli)
              </span>
              <p className="font-semibold text-kage-washi text-xs sm:text-sm mt-0.5 print:text-black">
                {ticket.customer?.name || 'Customer Terverifikasi'}
              </p>
              <p className="text-[11px] text-kage-mist-dim truncate print:text-gray-600">
                {ticket.customer?.email}
              </p>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-wider text-kage-mist-dim block print:text-gray-500">
                Penyelenggara Acara (EO)
              </span>
              <p className="font-semibold text-kage-washi text-xs sm:text-sm mt-0.5 print:text-black">
                {ticket.event.organizer?.organizer_profile?.organization_name ||
                  ticket.event.organizer?.name ||
                  'Kagemaya Official Organizer'}
              </p>
              <p className="text-[11px] text-kage-gold print:text-gray-700">
                Telah Terverifikasi oleh Sistem
              </p>
            </div>
          </div>

          {/* Ticket Items Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold text-kage-mist-dim uppercase tracking-wider print:text-gray-600">
              <span>Rincian Tiket</span>
              <span>Subtotal</span>
            </div>

            <div className="space-y-1.5">
              {ticket.transaction_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-kage-yoru-light/70 border border-kage-border/50 text-xs print:bg-gray-50 print:border-gray-300"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TicketIcon className="w-3.5 h-3.5 text-kage-gold shrink-0 print:text-black" />
                    <div className="min-w-0">
                      <p className="font-medium text-kage-washi truncate text-xs print:text-black">
                        {item.ticket_type?.name || 'Tiket Masuk'}
                      </p>
                      <p className="text-[10px] text-kage-mist-dim print:text-gray-500">
                        {item.quantity} Tiket × {formatRupiah(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-kage-washi font-mono text-xs ml-2 shrink-0 print:text-black">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Paid Row */}
            <div className="flex items-center justify-between pt-1 px-1 text-xs">
              <span className="text-kage-mist text-[11px] print:text-gray-700">
                Total Kursi:{' '}
                <strong className="text-kage-washi print:text-black">
                  {totalTickets} Kursi
                </strong>
              </span>
              <div className="text-right">
                <span className="text-[9px] text-kage-mist-dim block uppercase print:text-gray-500">
                  Total Bayar (Lunas)
                </span>
                <span className="font-serif font-bold text-sm sm:text-base text-kage-gold print:text-black">
                  {formatRupiah(ticket.final_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Barcode & Security Verification Stamp */}
          <div className="pt-3 border-t border-kage-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 print:border-gray-300">
            {/* Visual Barcode Pattern */}
            <div className="flex flex-col items-center sm:items-start space-y-0.5">
              <div className="bg-white px-2.5 py-1 rounded border border-gray-300 shadow-sm inline-block">
                <svg
                  className="h-8 w-44 sm:w-52"
                  viewBox="0 0 220 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="220" height="40" fill="white" />
                  {[
                    0, 4, 8, 14, 18, 22, 28, 34, 38, 44, 48, 52, 60, 64, 70, 76,
                    80, 86, 92, 96, 102, 108, 114, 120, 126, 130, 136, 142, 146,
                    152, 158, 164, 170, 174, 180, 186, 192, 196, 202, 208, 214,
                  ].map((x, idx) => (
                    <rect
                      key={idx}
                      x={x}
                      y={2}
                      width={idx % 3 === 0 ? 3.5 : idx % 2 === 0 ? 2 : 1.2}
                      height={36}
                      fill="black"
                    />
                  ))}
                </svg>
              </div>
              <span className="font-mono text-[9px] text-kage-mist-dim tracking-widest uppercase print:text-gray-600">
                *{ticketCode}*
              </span>
            </div>

            {/* Security Verification & Instruction Stamp */}
            <div className="text-center sm:text-right space-y-0.5 max-w-xs">
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-kage-success print:text-green-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Terverifikasi Sistem Kagemaya</span>
              </div>
              <p className="text-[9px] text-kage-mist-dim leading-relaxed print:text-gray-600">
                Tunjukkan e-tiket ini atau kode tiket kepada staf registrasi di lokasi acara untuk penukaran gelang / tiket fisik.
              </p>
            </div>
          </div>
        </div>

        {/* ── 5. TICKET FOOTER NOTE ── */}
        <div className="px-4 sm:px-5 py-2.5 bg-kage-yoru-light/50 border-t border-kage-border/80 flex flex-wrap items-center justify-between text-[9px] text-kage-mist-dim print:bg-white print:border-gray-300">
          <span className="truncate max-w-[220px] sm:max-w-none">
            Kagemaya Sinema 4D · ID: {cleanId.slice(0, 12)}...
          </span>
          <span className="font-mono">
            Cetak: {new Date().toLocaleDateString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}
