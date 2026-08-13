'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * The error boundary for the app. Without one, an uncaught render error shows
 * Next's default screen — in production a bare "Application error", with no
 * way back and nothing logged.
 *
 * Deliberately does not print `error.message`: it can carry internals, and a
 * student cannot act on it. The digest is shown instead, which is the handle
 * an admin can use to find the matching server log.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console, so it reaches whatever the browser is reporting to. The
    // message stays out of the UI but should not be lost.
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-red-50">
        <svg
          className="h-7 w-7 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-bold text-[var(--foreground)]">Ada yang tidak beres</h1>
      <p className="mt-3 text-sm text-[var(--text-body)]">
        Terjadi kesalahan saat memuat halaman ini. Data Anda aman — coba muat ulang, dan
        jika masih bermasalah, hubungi admin.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Coba Lagi
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--border-default)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-sunken)]"
        >
          Kembali ke Beranda
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 font-mono text-xs text-[var(--text-muted)]">
          Kode kesalahan: {error.digest}
        </p>
      )}

      <p className="mt-4 text-sm text-[var(--text-body)]">
        <a
          href="https://wa.me/886936501760"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 hover:underline"
        >
          Hubungi admin UT Taiwan
        </a>
      </p>
    </div>
  );
}
