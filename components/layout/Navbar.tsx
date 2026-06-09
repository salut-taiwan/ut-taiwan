'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ui/ThemeToggle';

const modulLinks = [
  { href: '/modules',  label: 'Semua Modul' },
  { href: '/program',  label: 'Program Studi' },
  { href: '/packages', label: 'Paket Modul' },
];

const flatLinks = [
  { href: '/panduan',     label: 'Panduan' },
  { href: '/toko',        label: 'Toko' },
  { href: '/sks-payment', label: 'Bayar SKS' },
  { href: '/salut',       label: 'SALUT' },
];

function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const modul = useDropdown();
  const account = useDropdown();

  const modulIsActive = modulLinks.some(l => pathname === l.href || pathname.startsWith(l.href + '/'));

  function closeMobile() { setMobileOpen(false); }

  return (
    <nav className="bg-[var(--surface-overlay)] backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-[var(--shadow-xs)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" prefetch={true} className="flex items-center shrink-0">
            <Image
              src="/LOGO SALUT UTT - NO BACKGROUND.png"
              alt="SALUT UT Taiwan"
              width={200}
              height={63}
              className="h-8 sm:h-11 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            {/* Modul dropdown */}
            <div ref={modul.ref} className="relative">
              <button
                type="button"
                onClick={() => modul.setOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={modul.open}
                className={cn(
                  'relative inline-flex items-center gap-1 font-medium rounded-md px-2.5 py-1.5 transition-colors duration-150',
                  modulIsActive
                    ? 'text-indigo-700 font-semibold'
                    : 'text-[var(--text-body)] hover:text-indigo-700'
                )}
              >
                {modulIsActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-indigo-50 rounded-md -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                Modul
                <svg
                  className={cn('w-3.5 h-3.5 transition-transform duration-150', modul.open && 'rotate-180')}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {modul.open && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-1 min-w-[180px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shadow-[var(--shadow-md)] py-1 z-50"
                >
                  {modulLinks.map(link => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        prefetch={true}
                        role="menuitem"
                        onClick={() => modul.setOpen(false)}
                        className={cn(
                          'block px-3 py-2 text-sm font-medium transition-[color,background-color] duration-150',
                          isActive
                            ? 'text-indigo-700 bg-indigo-50'
                            : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50'
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {flatLinks.map(link => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={cn(
                    'relative font-medium rounded-md px-2.5 py-1.5 transition-colors duration-150',
                    isActive
                      ? 'text-indigo-700 font-semibold'
                      : link.href === '/salut'
                        ? 'text-indigo-600 font-semibold animate-[ringPulse_2.5s_ease-in-out_infinite] hover:bg-indigo-100'
                        : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-indigo-50 rounded-md -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }}>
            <Link
              href="/cart"
              prefetch={true}
              aria-label={`Keranjang${cartCount > 0 ? `, ${cartCount} item` : ''}`}
              className="relative rounded-lg p-2 text-[var(--text-body)] hover:text-indigo-700 hover:bg-[var(--surface-sunken)] transition-[color,background-color] duration-150 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none px-1">
                  {cartCount}
                </span>
              )}
            </Link>
            </motion.div>

            {/* Desktop user links */}
            {isLoading ? (
              <div className="hidden md:flex items-center gap-2" aria-hidden="true">
                <div className="skeleton h-8 w-16 rounded-lg" />
                <div className="skeleton h-8 w-16 rounded-lg" />
              </div>
            ) : user ? (
              <div className="hidden md:flex items-center gap-1">
                <Link href="/orders" prefetch={true}
                  className={cn(
                    'text-sm font-medium rounded-md px-2.5 py-1.5 transition-[color,background-color] duration-150',
                    pathname.startsWith('/orders')
                      ? 'text-indigo-700 font-semibold bg-indigo-50'
                      : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50'
                  )}>
                  Pesanan
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" prefetch={true}
                    className={cn(
                      'text-sm font-medium rounded-md px-2.5 py-1.5 transition-[color,background-color] duration-150',
                      pathname.startsWith('/admin')
                        ? 'text-orange-700 bg-orange-50'
                        : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                    )}>
                    Admin
                  </Link>
                )}

                {/* Account dropdown */}
                <div ref={account.ref} className="relative">
                  <button
                    type="button"
                    onClick={() => account.setOpen(o => !o)}
                    aria-haspopup="menu"
                    aria-expanded={account.open}
                    aria-label="Menu akun"
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-[color,background-color,box-shadow] duration-150',
                      account.open
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    )}
                  >
                    {getInitials(user.name, user.email)}
                  </button>
                  {account.open && (
                    <div
                      role="menu"
                      className="absolute top-full right-0 mt-1 min-w-[220px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg shadow-[var(--shadow-md)] py-1 z-50"
                    >
                      <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">{user.name || 'Pengguna'}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        prefetch={true}
                        role="menuitem"
                        onClick={() => account.setOpen(false)}
                        className={cn(
                          'block px-3 py-2 text-sm font-medium transition-[color,background-color] duration-150',
                          pathname === '/profile'
                            ? 'text-indigo-700 bg-indigo-50'
                            : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50'
                        )}
                      >
                        Profil
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={async () => { account.setOpen(false); await logout(); router.push('/'); }}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-[var(--text-body)] hover:text-red-600 hover:bg-red-50 transition-[color,background-color] duration-150"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" prefetch={true}
                  className="text-sm border border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-[color,background-color,border-color] duration-150 font-medium">
                  Masuk
                </Link>
                <Link href="/register" prefetch={true}
                  className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 hover:-translate-y-px font-semibold transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]">
                  Daftar
                </Link>
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Buka menu navigasi"
              aria-expanded={mobileOpen}
              className="md:hidden rounded-lg p-2 text-[var(--text-body)] hover:bg-[var(--surface-sunken)] transition-colors duration-150"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel — AnimatePresence for smooth open/close */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ overflow: 'hidden' }}
              className="md:hidden border-t border-[var(--border-subtle)] px-[6px] -mx-[6px]"
            >
              <div className="py-3 space-y-0.5">
                {[...modulLinks, ...flatLinks].map(link => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobile}
                      className={cn(
                        'block px-3 py-2.5 rounded-xl text-sm font-medium transition-[color,background-color] duration-150',
                        isActive
                          ? 'text-indigo-700 font-semibold bg-indigo-50'
                          : link.href === '/salut'
                            ? 'text-indigo-600 font-semibold bg-indigo-50/60 animate-[ringPulse_2.5s_ease-in-out_infinite]'
                            : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50'
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="border-t border-[var(--border-subtle)] pt-2 mt-2 space-y-0.5">
                  {isLoading ? (
                    <div className="flex gap-2 px-3 pt-1" aria-hidden="true">
                      <div className="skeleton h-9 flex-1 rounded-lg" />
                      <div className="skeleton h-9 flex-1 rounded-lg" />
                    </div>
                  ) : user ? (
                    <>
                      <Link href="/orders" onClick={closeMobile} className={cn('block px-3 py-2.5 rounded-xl text-sm font-medium transition-[color,background-color] duration-150', pathname.startsWith('/orders') ? 'text-indigo-700 bg-indigo-50' : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50')}>Pesanan</Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={closeMobile} className={cn('block px-3 py-2.5 rounded-xl text-sm font-medium transition-[color,background-color] duration-150', pathname.startsWith('/admin') ? 'text-orange-700 bg-orange-50' : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50')}>Admin</Link>
                      )}
                      <Link href="/profile" onClick={closeMobile} className={cn('block px-3 py-2.5 rounded-xl text-sm font-medium transition-[color,background-color] duration-150', pathname === '/profile' ? 'text-indigo-700 bg-indigo-50' : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50')}>Profil</Link>
                      <button
                        onClick={async () => { closeMobile(); await logout(); router.push('/'); }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        Keluar
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2 px-3 pt-1">
                      <Link href="/login" onClick={closeMobile} className="flex-1 text-center text-sm border border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg font-medium transition-colors duration-150">Masuk</Link>
                      <Link href="/register" onClick={closeMobile} className="flex-1 text-center text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors duration-150">Daftar</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
