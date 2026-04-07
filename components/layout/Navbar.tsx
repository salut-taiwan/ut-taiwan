'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useCart();

  const navLinks = [
    { href: '/program', label: 'Program Studi' },
    { href: '/modules', label: 'Semua Modul' },
    { href: '/packages', label: 'Paket Semester' },
  ];

  return (
    <nav className="bg-[var(--surface-overlay)] backdrop-blur-xl border-b border-[var(--border-subtle)] shadow-[var(--shadow-xs)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" prefetch={true} className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-tight text-indigo-700">UT Taiwan</span>
            <span className="text-xs text-[var(--text-muted)] hidden sm:block">Toko Modul Kuliah</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 text-sm">
            {navLinks.map(link => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={cn(
                    'font-medium rounded-md px-2.5 py-1.5 transition-[color,background-color] duration-150',
                    isActive
                      ? 'text-indigo-700 font-semibold bg-indigo-50'
                      : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/cart" prefetch={true} className="relative rounded-lg p-2 text-[var(--text-body)] hover:text-indigo-700 hover:bg-[var(--surface-sunken)] transition-[color,background-color] duration-150">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center leading-none px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-1">
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
                <Link href="/profile" prefetch={true}
                  className={cn(
                    'text-sm font-medium rounded-md px-2.5 py-1.5 transition-[color,background-color] duration-150',
                    pathname === '/profile'
                      ? 'text-indigo-700 font-semibold bg-indigo-50'
                      : 'text-[var(--text-body)] hover:text-indigo-700 hover:bg-indigo-50'
                  )}>
                  Profil
                </Link>
                <button
                  onClick={async () => { await logout(); router.push('/'); }}
                  className="text-sm text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 rounded-md px-2.5 py-1.5 transition-[color,background-color] duration-150 font-medium"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>
    </nav>
  );
}
