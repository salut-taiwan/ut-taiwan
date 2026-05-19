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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-base font-semibold text-[var(--foreground)]">UT Taiwan</p>
            <p className="mt-0.5 text-sm text-[var(--text-body)]">Sentra Layanan Universitas Terbuka untuk Mahasiswa di Taiwan</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Sentra Layanan Universitas Terbuka (SALUT) Taiwan</p>
          </div>

          {/* Site nav */}
          <nav className="flex flex-col gap-2 text-sm text-[var(--text-body)]">
            <Link href="/modules"  className="hover:text-indigo-700 transition-colors duration-150">Semua Modul</Link>
            <Link href="/program"  className="hover:text-indigo-700 transition-colors duration-150">Program Studi</Link>
            <Link href="/packages" className="hover:text-indigo-700 transition-colors duration-150">Paket Semester</Link>
            <Link href="/panduan"  className="hover:text-indigo-700 transition-colors duration-150">Panduan</Link>
            <Link href="/orders"   className="hover:text-indigo-700 transition-colors duration-150">Pesanan</Link>
            <Link href="/salut"    className="hover:text-indigo-700 transition-colors duration-150">SALUT</Link>
            <Link href="/profile"  className="hover:text-indigo-700 transition-colors duration-150">Profil</Link>
          </nav>

          {/* Contact & UT links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">Hubungi Kami</p>

            {/* Social icons */}
            <div className="flex items-center gap-3 mb-2">
              <a
                href="https://www.instagram.com/univterbuka_taiwan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram UT Taiwan"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface-sunken)] text-[var(--text-body)] hover:text-pink-600 hover:bg-pink-50 transition-[color,background-color] duration-150"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/ut.taiwan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook UT Taiwan"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface-sunken)] text-[var(--text-body)] hover:text-blue-600 hover:bg-blue-50 transition-[color,background-color] duration-150"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>

            {/* Email */}
            <a
              href="mailto:pengurus.uttaiwan@gmail.com"
              className="text-sm text-[var(--text-body)] hover:text-indigo-700 transition-colors duration-150 break-all"
            >
              pengurus.uttaiwan@gmail.com
            </a>

            <div className="border-t border-[var(--border-subtle)] my-4" />

            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">Tautan UT</p>
            <div className="flex flex-col gap-1.5 text-sm">
              <a
                href="https://www.ut.ac.id/kalender-akademik/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-body)] hover:text-indigo-700 transition-colors duration-150"
              >
                Kalender Akademik
              </a>
              <a
                href="https://admisi-sia.ut.ac.id/beranda/daftar-aplikasi-ut"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-body)] hover:text-indigo-700 transition-colors duration-150"
              >
                Daftar Aplikasi UT
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
