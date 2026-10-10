import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-kage-black border-t border-kage-border pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-kage-border/60">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded bg-kage-red flex items-center justify-center text-white font-serif font-bold text-base">
                影
              </span>
              <span className="font-serif tracking-widest text-lg font-semibold text-kage-washi">
                KAGEMAYA<span className="text-kage-gold text-xs ml-0.5">.ID</span>
              </span>
            </div>
            <p className="text-xs text-kage-mist leading-relaxed font-sans">
              Platform kurasi pemutaran film sinema 4D, pertunjukan interaktif, dan workshop kreatif kolaborasi Tokyo–Jakarta.
            </p>
            <p className="text-[11px] text-kage-mist-dim italic font-serif">
              “Di balik bayangan, ilusi menjadi nyata.”
            </p>
          </div>

          {/* Navigasi Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-kage-gold font-sans">
              Eksplorasi
            </h4>
            <ul className="space-y-2 text-xs text-kage-mist">
              <li>
                <Link href="/events" className="hover:text-kage-washi transition">
                  Katalog Semua Event
                </Link>
              </li>
              <li>
                <Link href="/events?category=film-4d" className="hover:text-kage-washi transition">
                  Film 4D Experience
                </Link>
              </li>
              <li>
                <Link href="/events?category=workshop-kreatif" className="hover:text-kage-washi transition">
                  Workshop Kreatif
                </Link>
              </li>
              <li>
                <Link href="/events?category=anime-dan-manga" className="hover:text-kage-washi transition">
                  Anime & Budaya Pop
                </Link>
              </li>
            </ul>
          </div>

          {/* Untuk Organizer Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-kage-gold font-sans">
              Organizer
            </h4>
            <ul className="space-y-2 text-xs text-kage-mist">
              <li>
                <Link href="/register" className="hover:text-kage-washi transition">
                  Daftar Sebagai Organizer
                </Link>
              </li>
              <li>
                <Link href="/user/profile" className="hover:text-kage-washi transition">
                  Kelola Akun & Penjualan
                </Link>
              </li>
              <li>
                <a href="#benefits" className="hover:text-kage-washi transition">
                  Keuntungan Mitra Kagemaya
                </a>
              </li>
            </ul>
          </div>

          {/* Bantuan Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-kage-gold font-sans">
              Dukungan
            </h4>
            <ul className="space-y-2 text-xs text-kage-mist">
              <li>
                <a href="#faq" className="hover:text-kage-washi transition">
                  Pertanyaan Umum (FAQ)
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-kage-washi transition">
                  Hubungi Layanan Tiket
                </a>
              </li>
              <li>
                <span className="text-[11px] text-kage-mist-dim block">
                  Email: support@kagemaya.id
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-kage-mist-dim">
          <p>© 2026 Kagemaya.id. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-kage-mist transition">
              Kebijakan Privasi
            </a>
            <a href="#terms" className="hover:text-kage-mist transition">
              Syarat & Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
