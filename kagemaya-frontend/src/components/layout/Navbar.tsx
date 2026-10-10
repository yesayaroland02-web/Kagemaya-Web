'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getImageUrl } from '@/lib/utils';
import { Search, User as UserIcon, LogOut, ChevronDown, Menu, X, Sparkles, Ticket } from 'lucide-react';

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
                Sinema 4D & Kreatif
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
                {/* Dashboard / Tiket Button */}
                <Link
                  href={user.role === 'ORGANIZER' ? '/organizer/dashboard' : '/events'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-kage-border-light text-kage-washi hover:border-kage-gold transition"
                >
                  <Ticket className="w-3.5 h-3.5 text-kage-gold" />
                  <span>{user.role === 'ORGANIZER' ? 'Portal Organizer' : 'Cari Tiket'}</span>
                </Link>

                {/* Profile User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-kage-yoru border border-transparent hover:border-kage-border transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-kage-yoru-light border border-kage-border flex items-center justify-center overflow-hidden">
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
                    <span className="text-xs font-medium text-kage-gold max-w-[120px] truncate">
                      {formatShortName(user.name)}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-kage-mist-dim" />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-md shadow-2xl bg-kage-yoru border border-kage-border py-2 text-sm z-50">
                      <div className="px-4 py-2 border-b border-kage-border">
                        <p className="font-medium text-kage-washi truncate">{user.name}</p>
                        <p className="text-xs text-kage-mist-dim truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-kage-yoru-light text-kage-gold border border-kage-gold/30">
                          {user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/user/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-kage-mist hover:text-kage-washi hover:bg-kage-yoru-light transition"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-kage-gold" />
                          <span>Profil Akun & Rewards</span>
                        </Link>
                      </div>

                      <div className="border-t border-kage-border pt-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-kage-error hover:bg-kage-yoru-light transition text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar (Logout)</span>
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
        <div className="md:hidden border-b border-kage-border bg-kage-yoru px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm text-kage-mist hover:text-kage-washi"
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-kage-border pt-3">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/user/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm text-kage-gold font-medium"
                >
                  Profil: {user.name}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="block text-sm text-kage-error"
                >
                  Keluar
                </button>
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
