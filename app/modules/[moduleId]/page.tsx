'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatIDR } from '@/lib/utils';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { user } = useAuth();
  const { incrementCart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    api.modules.get(moduleId)
      .then(setModule)
      .catch(() => setModule(null))
      .finally(() => setLoading(false));
  }, [moduleId]);

  async function handleAddToCart() {
    if (!user) { window.location.href = '/login'; return; }
    setAdding(true);
    try {
      await api.cart.addItem(module.id);
      setAdded(true);
      incrementCart(1);
      showToast(module.is_available ? 'Modul ditambahkan ke keranjang!' : 'Modul ditambahkan sebagai permintaan!');
      setTimeout(() => setAdded(false), 3000);
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan ke keranjang', 'error');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl">
      <div className="h-4 w-32 rounded skeleton mb-6" />
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-72 min-h-64 skeleton" />
          <div className="p-6 flex-1 flex flex-col gap-4">
            <div className="h-4 w-24 rounded skeleton" />
            <div className="h-7 w-full rounded skeleton" />
            <div className="h-4 w-1/2 rounded skeleton" />
            <div className="h-20 rounded-xl skeleton" />
            <div className="h-12 w-40 rounded-xl skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
  if (!module) return <div className="text-center py-16 text-red-500">Modul tidak ditemukan</div>;

  const usedInSubjects = (module.subject_modules || []).map((sm: any) => sm.subjects).filter(Boolean);

  return (
    <div className="max-w-4xl">
      <Link href="/modules" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors duration-150 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Semua Modul
      </Link>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Cover */}
          <div className="bg-[var(--surface-sunken)] flex items-center justify-center sm:w-72 min-h-64 flex-shrink-0">
            {module.cover_image_url ? (
              <Image
                src={module.cover_image_url}
                alt={module.name}
                width={180}
                height={240}
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-indigo-200 p-8">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm text-[var(--text-muted)]">Tidak ada cover</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-sm text-indigo-600 font-bold">{module.tbo_code}</span>
              {module.has_multimedia && (
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium"># Multimedia</span>
              )}
              {!module.is_available && (
                <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">Tidak Tersedia</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-1">{module.name}</h1>
            {module.edition && <p className="text-sm text-[var(--text-body)] mb-4">{module.edition}</p>}

            <dl className="grid grid-cols-2 gap-3 mb-6 text-sm">
              {module.author && (
                <>
                  <dt className="text-[var(--text-body)]">Penulis</dt>
                  <dd className="text-[var(--foreground)]">{module.author}</dd>
                </>
              )}
              <dt className="text-[var(--text-body)]">Penerbit</dt>
              <dd className="text-[var(--foreground)]">{module.publisher || 'Universitas Terbuka'}</dd>
              {module.weight_grams && (
                <>
                  <dt className="text-[var(--text-body)]">Berat</dt>
                  <dd className="text-[var(--foreground)]">{module.weight_grams} gram</dd>
                </>
              )}
            </dl>

            <div className="mb-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl p-5">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">Harga Mahasiswa</p>
              <p className="text-3xl font-extrabold text-indigo-700 tabular-nums">
                {module.price_student ? formatIDR(module.price_student) : 'Hubungi Kami'}
              </p>
              {module.price_general && (
                <p className="text-sm text-[var(--text-muted)] mt-1">Harga Umum: {formatIDR(module.price_general)}</p>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-8 py-3 rounded-xl font-semibold transition-[background-color,transform,box-shadow] duration-150 disabled:opacity-50 active:scale-[0.98]
                ${added
                  ? 'bg-emerald-600 text-white'
                  : module.is_available && module.price_student
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-px shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]'
                    : 'bg-amber-500 text-white hover:bg-amber-600 hover:-translate-y-px shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]'
                }`}
            >
              {adding ? (
                <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Menambahkan...</>
              ) : added ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {module.is_available && module.price_student ? 'Ditambahkan ke Keranjang!' : 'Ditambahkan sebagai Permintaan!'}
                </>
              ) : module.is_available && module.price_student ? 'Tambah ke Keranjang' : 'Tambahkan sebagai Permintaan'}
            </button>
            {(!module.is_available || !module.price_student) && !added && (
              <p className="mt-2 text-xs text-amber-600">
                {!module.price_student
                  ? 'Harga modul ini belum tersedia. Admin akan mengkonfirmasi harga sebelum meminta pembayaran.'
                  : 'Stok sedang tidak tersedia di TBO Karunika. Anda dapat mengajukan permintaan dan admin akan mengkonfirmasi ketersediaannya.'
                }
              </p>
            )}

            {module.tbo_url && (
              <a href={module.tbo_url} target="_blank" rel="noopener noreferrer"
                className="block mt-3 text-sm text-indigo-500 hover:text-indigo-700 hover:underline transition-colors duration-150">
                Lihat di TBO Karunika →
              </a>
            )}
          </div>
        </div>

        {/* Used in subjects */}
        {usedInSubjects.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] px-6 py-5">
            <h2 className="font-semibold text-[var(--foreground)] mb-3">Digunakan untuk Mata Kuliah</h2>
            <div className="space-y-0">
              {usedInSubjects.map((subject: any) => (
                <div key={subject.id}
                  className="flex items-center justify-between text-sm py-2.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-sunken)] rounded-lg px-2 -mx-2 transition-colors duration-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--text-muted)]">{subject.code}</span>
                    <span className="text-[var(--text-body)]">{subject.name}</span>
                  </div>
                  {subject.programs && (
                    <Link href={`/program/${subject.programs.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-150">
                      {subject.programs.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
