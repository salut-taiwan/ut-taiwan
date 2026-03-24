'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/program', label: 'Program Studi' },
    { href: '/modules', label: 'Semua Modul' },
    { href: '/packages', label: 'Paket Semester' },
  ];

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className={cn(
        'sticky top-0 z-50 transition-all duration-300 ease-out',
        scrolled 
          ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)]' 
          : 'bg-white/70 backdrop-blur-md border-b border-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" prefetch={true} className="flex items-center gap-2.5 group">
              <div className="relative">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-indigo-600 group-hover:to-indigo-500">
                  UT Taiwan
                </span>
                <div className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-amber-400 transition-all duration-300 group-hover:w-full" />
              </div>
              <span className="text-xs text-slate-400 hidden sm:block font-medium tracking-wide">
                Toko Modul Kuliah
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  prefetch={true} 
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActiveLink(link.href) 
                      ? 'text-indigo-700 bg-indigo-50' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  )}
                >
                  {link.label}
                  {isActiveLink(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
                  )}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart Button */}
              <Link 
                href="/cart" 
                prefetch={true} 
                className={cn(
                  'relative p-2.5 rounded-xl transition-all duration-200',
                  'text-slate-600 hover:text-indigo-600 hover:bg-slate-50',
                  'active:scale-95'
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <span className={cn(
                    'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1',
                    'bg-amber-500 text-white text-[10px] font-bold rounded-full',
                    'flex items-center justify-center',
                    'shadow-[0_2px_4px_rgba(250,218,2,0.3)]',
                    'animate-scale-in'
                  )}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="hidden sm:flex items-center gap-1">
                  <Link 
                    href="/orders" 
                    prefetch={true} 
                    className={cn(
                      'text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200',
                      pathname.startsWith('/orders')
                        ? 'text-indigo-700 bg-indigo-50'
                        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                    )}
                  >
                    Pesanan
                  </Link>
                  {user.role === 'admin' && (
                    <Link 
                      href="/admin" 
                      prefetch={true} 
                      className={cn(
                        'text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200',
                        'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                      )}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={async () => { await logout(); router.push('/'); }}
                    className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 py-2 px-3 rounded-lg font-medium"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link 
                    href="/login" 
                    prefetch={true} 
                    className={cn(
                      'text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200',
                      'text-indigo-600 hover:bg-indigo-50',
                      'active:scale-[0.97]'
                    )}
                  >
                    Masuk
                  </Link>
                  <Link 
                    href="/register" 
                    prefetch={true}
                    className={cn(
                      'text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200',
                      'bg-indigo-600 text-white hover:bg-indigo-700',
                      'shadow-[var(--shadow-btn-primary)]',
                      'active:scale-[0.97]'
                    )}
                  >
                    Daftar
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  'md:hidden p-2 rounded-lg transition-all duration-200',
                  'text-slate-600 hover:bg-slate-100',
                  mobileMenuOpen && 'bg-slate-100'
                )}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-out',
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}>
          <div className="px-4 py-4 space-y-1 bg-white/95 backdrop-blur-lg border-t border-slate-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={cn(
                  'block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActiveLink(link.href)
                    ? 'text-indigo-700 bg-indigo-50'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
              {user ? (
                <>
                  <Link href="/orders" className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Pesanan Saya
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-3 rounded-xl text-sm font-medium text-orange-600 hover:bg-orange-50">
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => { await logout(); router.push('/'); }}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-2">
                  <Link href="/login" className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50">
                    Masuk
                  </Link>
                  <Link href="/register" className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700">
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
