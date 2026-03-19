'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.cart.get().then((cart: any) => setCartCount(cart.itemCount || 0)).catch(() => {});
    } else {
      setCartCount(0);
    }
  }, [user]);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-indigo-700">UT Taiwan</span>
            <span className="text-xs text-slate-400 hidden sm:block">Toko Modul Kuliah</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/program" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Program Studi
            </Link>
            <Link href="/modules" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Semua Modul
            </Link>
            <Link href="/packages" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
              Paket Semester
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/orders" className="text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors">
                  Pesanan
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                    Admin
                  </Link>
                )}
                <button
                  onClick={async () => { await logout(); router.push('/'); }}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm border border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-medium">
                  Masuk
                </Link>
                <Link href="/register"
                  className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold transition-colors shadow-sm">
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
