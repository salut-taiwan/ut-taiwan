import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan | UT Taiwan',
};

/**
 * The 404 for the whole app, including every notFound() call — the product
 * page raises one for an id that does not exist, and until now that rendered
 * Next's default: an unstyled English page with no way back into the site.
 *
 * Built against the checklist.design 404 list: mark, title, an explanation,
 * and pathways out (home, the two things people are usually looking for, and
 * a way to reach a human).
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <Image
        src="/LOGO SALUT UTT - NO BACKGROUND.png"
        alt="SALUT UT Taiwan"
        width={200}
        height={63}
        className="h-10 w-auto object-contain"
      />

      <p className="mt-8 font-[family-name:var(--font-display)] text-6xl font-extrabold text-indigo-600">
        404
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 text-sm text-[var(--text-body)]">
        Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau alamatnya salah
        ketik. Tidak ada yang rusak — mari kembali ke jalur yang benar.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/program"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--border-default)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-sunken)]"
        >
          Cari Modul
        </Link>
      </div>

      <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 text-sm text-[var(--text-body)]">
        <p>
          Masih tersesat?{' '}
          <a
            href="https://wa.me/886936501760"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:underline"
          >
            Hubungi admin UT Taiwan
          </a>
          .
        </p>
        <p className="mt-2">
          Atau lihat{' '}
          <Link href="/panduan" className="font-medium text-indigo-600 hover:underline">
            panduan
          </Link>{' '}
          untuk pertanyaan yang sering muncul.
        </p>
      </div>
    </div>
  );
}
