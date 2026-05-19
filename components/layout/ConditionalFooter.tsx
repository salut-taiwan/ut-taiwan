'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NO_FOOTER_PATHS = ['/login', '/register'];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (NO_FOOTER_PATHS.includes(pathname)) return null;
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-base font-semibold text-[var(--foreground)]">UT Taiwan</p>
            <p className="mt-0.5 text-sm text-[var(--text-body)]">Layanan Pembelian Modul Mahasiswa Universitas Terbuka di Taiwan</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Sentra Layanan Universitas Terbuka (SALUT) Taiwan</p>
          </div>
          <nav className="flex items-center gap-5 text-sm text-[var(--text-body)]">
            <Link href="/program" className="hover:text-indigo-700 transition-colors duration-150">Program Studi</Link>
            <Link href="/modules" className="hover:text-indigo-700 transition-colors duration-150">Semua Modul</Link>
            <Link href="/packages" className="hover:text-indigo-700 transition-colors duration-150">Paket Semester</Link>
            <Link href="/orders" className="hover:text-indigo-700 transition-colors duration-150">Pesanan</Link>
            <Link href="/salut" className="hover:text-indigo-700 transition-colors duration-150">SALUT</Link>
            <Link href="/profile" className="hover:text-indigo-700 transition-colors duration-150">Profil</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}