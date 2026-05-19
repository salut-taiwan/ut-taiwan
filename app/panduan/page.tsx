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
      next: { revalidate: 3600 },
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

      {/* Footer note */}
      <p className="mt-10 text-xs text-[var(--text-muted)] text-center">
        Panduan bersumber dari Universitas Terbuka. Untuk informasi terbaru, kunjungi{' '}
        <a href="https://www.ut.ac.id" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ut.ac.id</a>.
      </p>
    </div>
  );
}
