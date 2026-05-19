import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { ProductDTO } from '@/types';
import { formatIDR } from '@/lib/utils';
import { storageUrl } from '@/lib/storage';

export const metadata: Metadata = {
  title: 'Toko UT Taiwan | Sentra Layanan Universitas Terbuka Taiwan',
  description: 'Belanja merchandise resmi Universitas Terbuka: jas almamater, jaket, kaos, tas, dan aksesoris UT Taiwan.',
};

const CATEGORIES: { key: string; label: string }[] = [
  { key: '', label: 'Semua' },
  { key: 'jas-almamater', label: 'Jas Almamater' },
  { key: 'jaket', label: 'Jaket' },
  { key: 'jersey', label: 'Jersey' },
  { key: 'training-set', label: 'Training Set' },
  { key: 'kaos', label: 'Kaos' },
  { key: 'tas', label: 'Tas & Clutch' },
  { key: 'aksesoris', label: 'Aksesoris' },
];

async function getProducts(category?: string): Promise<ProductDTO[]> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/products${category ? `?category=${encodeURIComponent(category)}` : ''}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function TokoPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const products = await getProducts(category);

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
              href={cat.key ? `/toko?category=${cat.key}` : '/toko'}
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
                    src={storageUrl(product.cover_image_url)}
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
              </div>
              <div className="p-3">
                <p className="text-xs text-indigo-600 font-semibold mb-1 capitalize">
                  {product.category.replace(/-/g, ' ')}
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 leading-snug mb-2">
                  {product.name}
                </p>
                <p className="text-sm font-bold text-[var(--foreground)] tabular-nums">
                  {formatIDR(product.base_price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
