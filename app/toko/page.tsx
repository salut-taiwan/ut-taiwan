import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { ProductListResponseDTO } from '@/types';
import { TOKO_CATEGORIES } from '@/lib/toko-categories';

export const metadata: Metadata = {
  title: 'Toko UT Taiwan | Sentra Layanan Universitas Terbuka Taiwan',
  description: 'Belanja merchandise resmi Universitas Terbuka: jas almamater, jaket, kaos, tas, dan aksesoris UT Taiwan.',
};

const CATEGORIES = TOKO_CATEGORIES;

const PAGE_SIZE = 24;

const EMPTY_RESPONSE: ProductListResponseDTO = { rows: [], total: 0, limit: PAGE_SIZE, offset: 0 };

async function getProducts(category: string | undefined, page: number): Promise<ProductListResponseDTO> {
  try {
    const offset = (page - 1) * PAGE_SIZE;
    const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (category) qs.set('category', category);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/products?${qs.toString()}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return EMPTY_RESPONSE;
    return res.json();
  } catch {
    return EMPTY_RESPONSE;
  }
}

function buildHref(category: string | undefined, page: number): string {
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (page > 1) qs.set('page', String(page));
  const s = qs.toString();
  return s ? `/toko?${s}` : '/toko';
}

export default async function TokoPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page: pageRaw } = await searchParams;
  const parsedPage = Number.parseInt(pageRaw ?? '1', 10);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const { rows: products, total } = await getProducts(category, page);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (total > 0 && page > totalPages) {
    redirect(buildHref(category, totalPages));
  }
  const currentPage = Math.min(page, totalPages);
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">&larr; Beranda</Link>
        <div className="mt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Merchandise Resmi</span>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mt-1 mb-2">Toko UT Taiwan</h1>
          <p className="text-[var(--text-body)] max-w-xl">
            Jas almamater, jaket, kaos, tas, dan aksesoris Universitas Terbuka untuk mahasiswa di Taiwan.
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => {
          const isActive = (category ?? '') === cat.key;
          return (
            <Link
              key={cat.key}
              href={buildHref(cat.key || undefined, 1)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-body)] hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-lg font-semibold mb-1">Produk tidak ditemukan</p>
          <p className="text-sm">Coba kategori lain atau kembali lagi nanti.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <Link
                key={product.id}
                href={`/toko/${product.id}`}
                className="group bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200"
              >
                <div className="aspect-square bg-[var(--surface-sunken)] relative overflow-hidden">
                  {product.cover_image_url ? (
                    <Image
                      src={product.cover_image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 6.75h18M3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
                      </svg>
                    </div>
                  )}
                  {product.claim_rule === 'salut_sem1_once' && (
                    <span className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shadow-sm">
                      Khusus SALUT
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-indigo-600 font-semibold mb-1 capitalize">
                    {product.category.replace(/-/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 leading-snug mb-2">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">
                    {product.base_price_display}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 text-sm text-[var(--text-muted)]">
              <span>
                Menampilkan <span className="font-semibold text-[var(--foreground)]">{rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}</span> dari <span className="font-semibold text-[var(--foreground)]">{total.toLocaleString()}</span>
              </span>
              <div className="flex items-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={buildHref(category, currentPage - 1)}
                    className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-colors"
                  >
                    ← Prev
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg bg-[var(--surface)] opacity-40 cursor-not-allowed">← Prev</span>
                )}
                <span className="text-xs">Halaman {currentPage} / {totalPages}</span>
                {currentPage < totalPages ? (
                  <Link
                    href={buildHref(category, currentPage + 1)}
                    className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-sunken)] transition-colors"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg bg-[var(--surface)] opacity-40 cursor-not-allowed">Next →</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
