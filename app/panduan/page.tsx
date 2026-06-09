import Link from 'next/link';
import { PANDUAN_CATEGORIES, type PanduanCategory, type PanduanGuide } from '@/lib/panduan';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panduan UT Taiwan | Sentra Layanan Universitas Terbuka Taiwan',
  description: 'Panduan resmi Universitas Terbuka untuk mahasiswa di Taiwan: login eCampus, registrasi mata kuliah, pembayaran SPP, dan ujian online.',
};

async function getPanduanCategories(): Promise<PanduanCategory[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/panduan`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return PANDUAN_CATEGORIES.map(cat => ({ ...cat, guides: [] }));
    const data: { id: string; guides: PanduanGuide[] }[] = await res.json();
    return PANDUAN_CATEGORIES.map(cat => ({
      ...cat,
      guides: data.find(d => d.id === cat.id)?.guides ?? [],
    }));
  } catch {
    return PANDUAN_CATEGORIES.map(cat => ({ ...cat, guides: [] }));
  }
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

export default async function PanduanPage() {
  const categories = await getPanduanCategories();
  const hasGuides = categories.some(c => c.guides.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">&larr; Beranda</Link>
        <div className="mt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Sumber daya resmi</span>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mt-1 mb-2">Panduan UT Taiwan</h1>
          <p className="text-[var(--text-body)] max-w-xl">
            Kumpulan panduan resmi Universitas Terbuka untuk membantu mahasiswa di Taiwan dari pendaftaran hingga ujian.
          </p>
        </div>
      </div>

      {!hasGuides && (
        <div className="mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>Panduan belum tersedia saat ini. Silakan coba lagi nanti.</span>
        </div>
      )}

      {/* Category quick-nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
        {categories.map(cat => (
          <a
            key={cat.id}
            href={`#${cat.id}`}
            className="group flex flex-col items-center gap-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-4 text-center hover:border-indigo-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-150"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors duration-150">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[var(--text-body)] leading-snug">{cat.label}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{cat.guides.length} panduan</span>
          </a>
        ))}
      </div>

      {/* Category sections */}
      <div className="space-y-8">
        {categories.map(cat => (
          <section key={cat.id} id={cat.id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">{cat.label}</h2>
                <p className="text-xs text-[var(--text-muted)]">{cat.description}</p>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] overflow-hidden">
              {cat.guides.length > 0 ? cat.guides.map(guide => (
                <div key={guide.url} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface-sunken)] transition-colors duration-150">
                  <PdfIcon className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)]">{guide.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={guide.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-[color,background-color] duration-150"
                    >
                      Buka
                    </a>
                    <a
                      href={guide.url}
                      download
                      className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-sunken)] px-3 py-1.5 rounded-lg border border-[var(--border)] transition-[color,background-color] duration-150"
                    >
                      Unduh
                    </a>
                  </div>
                </div>
              )) : (
                <div className="px-5 py-4 text-sm text-[var(--text-muted)] italic">Belum tersedia.</div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Tautan Berguna */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Tautan Berguna</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://www.ut.ac.id/kalender-akademik/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl px-5 py-4 hover:border-indigo-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-150"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors duration-150">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)]">Kalender Akademik UT</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Jadwal registrasi, ujian, dan kegiatan akademik</p>
            </div>
            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0 group-hover:text-indigo-500 transition-colors duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>

          <a
            href="https://admisi-sia.ut.ac.id/beranda/daftar-aplikasi-ut"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl px-5 py-4 hover:border-indigo-200 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-[border-color,box-shadow,transform] duration-150"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors duration-150">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)]">Daftar Aplikasi UT</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">SIA, eCampus, dan aplikasi resmi UT lainnya</p>
            </div>
            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0 group-hover:text-indigo-500 transition-colors duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-[var(--text-muted)] text-center">
        Panduan bersumber dari Universitas Terbuka. Untuk informasi terbaru, kunjungi{' '}
        <a href="https://www.ut.ac.id" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ut.ac.id</a>.
      </p>
    </div>
  );
}
