'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ModuleDTO } from '@/types';
import { formatIDR } from '@/lib/utils';

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.modules.get(moduleId)
      .then(setModule)
      .finally(() => setLoading(false));
  }, [moduleId]);

  async function handleAddToCart() {
    const token = localStorage.getItem('ut_token');
    if (!token) { window.location.href = '/login'; return; }
    setAdding(true);
    try {
      await api.cart.addItem(module.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Memuat...</div>;
  if (!module) return <div className="text-center py-16 text-red-500">Modul tidak ditemukan</div>;

  const usedInSubjects = (module.subject_modules || []).map((sm: any) => sm.subjects).filter(Boolean);

  return (
    <div className="max-w-4xl">
      <Link href="/modules" className="text-sm text-blue-600 hover:underline">&larr; Semua Modul</Link>

      <div className="mt-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Cover */}
          <div className="bg-gray-100 flex items-center justify-center sm:w-64 min-h-64 flex-shrink-0">
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
              <div className="text-gray-400 text-center p-8">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm">Tidak ada cover</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm text-blue-600 font-bold">{module.tbo_code}</span>
              {module.has_multimedia && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"># Multimedia</span>
              )}
              {!module.is_available && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Tidak Tersedia</span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">{module.name}</h1>
            {module.edition && <p className="text-sm text-gray-500 mb-4">{module.edition}</p>}

            <dl className="grid grid-cols-2 gap-3 mb-6 text-sm">
              {module.author && (
                <>
                  <dt className="text-gray-500">Penulis</dt>
                  <dd className="text-gray-900">{module.author}</dd>
                </>
              )}
              <dt className="text-gray-500">Penerbit</dt>
              <dd className="text-gray-900">{module.publisher || 'Universitas Terbuka'}</dd>
              {module.weight_grams && (
                <>
                  <dt className="text-gray-500">Berat</dt>
                  <dd className="text-gray-900">{module.weight_grams} gram</dd>
                </>
              )}
            </dl>

            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-1">Harga Mahasiswa</p>
              <p className="text-3xl font-bold text-gray-900">
                {module.price_student ? formatIDR(module.price_student) : 'Hubungi Kami'}
              </p>
              {module.price_general && (
                <p className="text-sm text-gray-400 mt-1">Harga Umum: {formatIDR(module.price_general)}</p>
              )}
            </div>

            {module.is_available ? (
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {adding ? 'Menambahkan...' : added ? 'Ditambahkan ke Keranjang!' : 'Tambah ke Keranjang'}
              </button>
            ) : (
              <p className="text-red-500 font-medium">Modul ini sedang tidak tersedia di TBO Karunika</p>
            )}

            {module.tbo_url && (
              <a href={module.tbo_url} target="_blank" rel="noopener noreferrer"
                className="block mt-3 text-sm text-blue-500 hover:underline">
                Lihat di TBO Karunika &rarr;
              </a>
            )}
          </div>
        </div>

        {/* Used in subjects */}
        {usedInSubjects.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5">
            <h2 className="font-semibold text-gray-900 mb-3">Digunakan untuk Mata Kuliah</h2>
            <div className="space-y-2">
              {usedInSubjects.map((subject: any) => (
                <div key={subject.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{subject.code}</span>
                    <span className="text-gray-700">{subject.name}</span>
                  </div>
                  {subject.programs && (
                    <Link href={`/program/${subject.programs.id}`}
                      className="text-xs text-blue-600 hover:underline">
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
