'use client';

import {
  Bookmark,
  ChevronDown,
  Layers,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  Ticket,
  TrendingUp,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format short name (e.g., "Hana Maharani" -> "Hana M.")
  const formatShortName = (fullName?: string) => {
    if (!fullName) return 'Pengguna';
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
    }
    return parts[0];
  };

  const navLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Eksplorasi Event', href: '/events' },
  ];

  // Organizer menu navigation items
  const organizerLinks = [
    { name: 'Dashboard Statistik', href: '/organizer/dashboard', icon: TrendingUp },
    { name: 'Event Saya', href: '/organizer/events', icon: Layers },
    { name: 'Transaksi Masuk', href: '/organizer/transactions', icon: Ticket },
    { name: 'Pengikut (Followers)', href: '/organizer/followers', icon: Users },
  ];

  // Personal / User navigation items
  const userLinks = [
    { name: 'Wishlist Saya', href: '/user/wishlist', icon: Bookmark },
    { name: 'Riwayat Transaksi', href: '/user/transactions', icon: Ticket },
    { name: 'Profil & Rewards', href: '/user/profile', icon: UserIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-kage-black/90 backdrop-blur-md border-b border-kage-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="w-8 h-8 rounded bg-kage-red flex items-center justify-center text-white font-serif font-bold text-lg shadow-md group-hover:bg-kage-vermilion transition">
              影
            </span>
            <div className="flex flex-col">
              <span className="font-serif tracking-widest text-lg font-semibold text-kage-washi group-hover:text-kage-gold transition">
                KAGEMAYA<span className="text-kage-gold text-xs ml-0.5">.ID</span>
              </span>
              <span className="text-[10px] tracking-wider text-kage-mist-dim font-sans uppercase">
                Sinema 4D &amp; Kreatif
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition ${
                    isActive
                      ? 'text-kage-gold'
                      : 'text-kage-mist hover:text-kage-washi'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/events"
              className="p-2 text-kage-mist hover:text-kage-washi transition"
              title="Cari Event"
            >
              <Search className="w-4 h-4" />
            </Link>

            {isLoading ? (
              <div className="h-8 w-24 bg-kage-yoru rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Wishlist Icon Quick Shortcut */}
                <Link
                  href="/user/wishlist"
                  className="p-2 text-kage-mist hover:text-kage-gold transition"
                  title="Wishlist Saya"
                >
                  <Bookmark className="w-4 h-4" />
                </Link>

                {/* Dashboard / Tiket Button */}
                {user.role === 'ORGANIZER' ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/organizer/dashboard"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        pathname === '/organizer/dashboard'
                          ? 'border-kage-gold text-kage-gold bg-kage-gold/10'
                          : 'border-kage-border-light text-kage-washi hover:border-kage-gold hover:text-kage-gold'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-kage-gold" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/organizer/events"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        pathname === '/organizer/events'
                          ? 'border-kage-gold text-kage-gold bg-kage-gold/10'
                          : 'border-kage-border-light text-kage-washi hover:border-kage-gold hover:text-kage-gold'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-kage-gold" />
                      <span>Event Saya</span>
                    </Link>
                    <Link
                      href="/organizer/events/create"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-kage-red hover:bg-kage-vermilion text-white shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Event</span>
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/events"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-kage-border-light text-kage-washi hover:border-kage-gold transition"
                  >
                    <Ticket className="w-3.5 h-3.5 text-kage-gold" />
                    <span>Cari Tiket</span>
                  </Link>
                )}

                {/* Profile User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-expanded={dropdownOpen}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border transition ${
                      dropdownOpen
                        ? 'bg-kage-yoru border-kage-gold/50 text-kage-washi shadow-sm'
                        : 'border-transparent text-kage-washi hover:bg-kage-yoru hover:border-kage-border'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-kage-yoru-light border border-kage-gold/30 flex items-center justify-center overflow-hidden shrink-0">
                      {user.profile_picture ? (
                        <img
                          src={getImageUrl(user.profile_picture)}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-serif text-kage-gold font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-medium text-kage-washi max-w-[110px] truncate leading-none">
                        {formatShortName(user.name)}
                      </span>
                      <span className="text-[9px] text-kage-gold/90 font-medium leading-none mt-1 uppercase tracking-wider">
                        {user.role === 'ORGANIZER' ? 'Organizer' : 'Member'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-kage-mist-dim transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180 text-kage-gold' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-72 rounded-xl shadow-2xl bg-kage-yoru/95 backdrop-blur-xl border border-kage-border p-2 z-50 ring-1 ring-white/5 divide-y divide-kage-border/60">
                      {/* User Profile Header Card */}
                      <div className="p-2.5 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-kage-yoru border border-kage-gold/40 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                            {user.profile_picture ? (
                              <img
                                src={getImageUrl(user.profile_picture)}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-serif text-kage-gold font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-kage-washi text-xs truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-kage-mist-dim truncate mt-0.5">
                              {user.email}
                            </p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border ${
                                  user.role === 'ORGANIZER'
                                    ? 'bg-kage-gold/15 text-kage-gold border-kage-gold/30'
                                    : 'bg-kage-yoru-light text-kage-mist border-kage-border'
                                }`}
                              >
                                {user.role === 'ORGANIZER' ? (
                                  <>
                                    <Sparkles className="w-2.5 h-2.5 text-kage-gold" />
                                    <span>Organizer</span>
                                  </>
                                ) : (
                                  <span>Member</span>
                                )}
                              </span>
                              {user.referral_code && (
                                <span className="text-[10px] text-kage-mist-dim font-mono tracking-wider">
                                  Ref: {user.referral_code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Organizer Section */}
                      {user.role === 'ORGANIZER' && (
                        <div className="py-1.5">
                          <div className="px-3 pt-1 pb-1 flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-kage-mist-dim">
                            <span>Panel Organizer</span>
                            <span className="text-[9px] text-kage-gold/80 font-normal">Manajemen</span>
                          </div>
                          <div className="space-y-0.5">
                            {organizerLinks.map((link) => {
                              const Icon = link.icon;
                              const isActive = pathname === link.href;
                              return (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={() => setDropdownOpen(false)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                                    isActive
                                      ? 'bg-kage-gold/15 text-kage-gold font-semibold shadow-xs'
                                      : 'text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Icon
                                      className={`w-4 h-4 shrink-0 transition-colors ${
                                        isActive
                                          ? 'text-kage-gold'
                                          : 'text-kage-mist-dim group-hover:text-kage-gold'
                                      }`}
                                    />
                                    <span className="truncate">{link.name}</span>
                                  </div>
                                  {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-kage-gold shrink-0" />
                                  )}
                                </Link>
                              );
                            })}

                            <Link
                              href="/organizer/events/create"
                              onClick={() => setDropdownOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                                pathname === '/organizer/events/create'
                                  ? 'bg-kage-red/20 text-kage-vermilion font-semibold'
                                  : 'text-kage-mist hover:text-kage-vermilion hover:bg-kage-red/10'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Plus className="w-4 h-4 shrink-0 text-kage-vermilion group-hover:rotate-90 transition-transform" />
                                <span className="truncate font-semibold">Buat Event Baru</span>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-kage-red/15 border border-kage-red/30 text-kage-vermilion font-medium">
                                + Baru
                              </span>
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Personal / User Section */}
                      <div className="py-1.5">
                        <div className="px-3 pt-1 pb-1 text-[10px] uppercase font-semibold tracking-wider text-kage-mist-dim">
                          <span>Akun Saya</span>
                        </div>
                        <div className="space-y-0.5">
                          {userLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setDropdownOpen(false)}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                                  isActive
                                    ? 'bg-kage-gold/15 text-kage-gold font-semibold shadow-xs'
                                    : 'text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Icon
                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                      isActive
                                        ? 'text-kage-gold'
                                        : 'text-kage-mist-dim group-hover:text-kage-gold'
                                    }`}
                                  />
                                  <span className="truncate">{link.name}</span>
                                </div>
                                {isActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-kage-gold shrink-0" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {/* Logout Action */}
                      <div className="pt-1.5">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-kage-error/90 hover:text-kage-error hover:bg-kage-error/10 transition group text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <LogOut className="w-4 h-4 shrink-0 text-kage-error/80 group-hover:text-kage-error group-hover:-translate-x-0.5 transition-transform" />
                            <span>Keluar (Logout)</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-kage-mist hover:text-kage-washi transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-xs font-semibold rounded bg-kage-red hover:bg-kage-vermilion text-white shadow-sm transition"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-kage-mist hover:text-kage-washi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-kage-border bg-kage-yoru px-4 pt-3 pb-5 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  pathname === link.href
                    ? 'text-kage-gold'
                    : 'text-kage-mist hover:text-kage-washi'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-kage-border/80 pt-3">
            {user ? (
              <div className="space-y-3">
                {/* Mobile User Header */}
                <div className="flex items-center gap-3 p-2.5 bg-kage-yoru-light rounded-lg border border-kage-border/60">
                  <div className="w-9 h-9 rounded-full bg-kage-yoru border border-kage-gold/40 flex items-center justify-center overflow-hidden shrink-0">
                    {user.profile_picture ? (
                      <img
                        src={getImageUrl(user.profile_picture)}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-serif text-kage-gold font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-kage-washi text-xs truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-kage-mist-dim truncate">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-kage-gold/15 text-kage-gold border border-kage-gold/30">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Mobile Organizer Links */}
                {user.role === 'ORGANIZER' && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-kage-mist-dim px-1">
                      Panel Organizer
                    </p>
                    {organizerLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium ${
                            pathname === link.href
                              ? 'text-kage-gold bg-kage-gold/10'
                              : 'text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-kage-gold shrink-0" />
                          <span>{link.name}</span>
                        </Link>
                      );
                    })}
                    <Link
                      href="/organizer/events/create"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-kage-vermilion hover:bg-kage-red/10"
                    >
                      <Plus className="w-4 h-4 shrink-0 text-kage-vermilion" />
                      <span>Buat Event Baru</span>
                    </Link>
                  </div>
                )}

                {/* Mobile User Links */}
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-semibold tracking-wider text-kage-mist-dim px-1">
                    Akun Saya
                  </p>
                  {userLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium ${
                          pathname === link.href
                            ? 'text-kage-gold bg-kage-gold/10'
                            : 'text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-kage-gold shrink-0" />
                        <span>{link.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-kage-border/60">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-kage-error hover:bg-kage-red/10 transition text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs border border-kage-border rounded text-kage-washi"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs bg-kage-red rounded text-white font-medium"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
