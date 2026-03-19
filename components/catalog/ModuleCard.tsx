'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ModuleSummaryDTO } from '@/types';
import { formatIDR } from '@/lib/utils';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cart';

interface ModuleCardProps {
  module: ModuleSummaryDTO;
  onAddedToCart?: () => void;
}

export default function ModuleCard({ module, onAddedToCart }: ModuleCardProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { showToast } = useToast();
  const { incrementCart } = useCart();

  async function handleAdd() {
    const token = localStorage.getItem('ut_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    setAdding(true);
    try {
      await api.cart.addItem(module.id);
      setAdded(true);
      incrementCart(1);
      showToast('Modul ditambahkan ke keranjang!');
      onAddedToCart?.();
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col border-t-4 border-t-indigo-500">
      <Link href={`/modules/${module.id}`} className="block">
        <div className="bg-slate-50 h-48 flex items-center justify-center overflow-hidden">
          {module.cover_image_url ? (
            <Image
              src={module.cover_image_url}
              alt={module.name}
              width={120}
              height={160}
              className="object-contain h-full w-auto"
              unoptimized
            />
          ) : (
            <div className="text-slate-400 text-center px-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-xs">No Cover</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <span className="text-xs font-mono text-indigo-600 font-semibold mb-1">{module.tbo_code}</span>
        <Link href={`/modules/${module.id}`}>
          <h3 className="text-sm font-medium text-slate-900 line-clamp-2 hover:text-indigo-700 mb-2">{module.name}</h3>
        </Link>
        <div className="mt-auto">
          {module.is_available ? (
            <>
              <p className="text-base font-bold text-indigo-700 mb-3">
                {module.price_student ? formatIDR(module.price_student) : 'Hubungi Kami'}
              </p>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="w-full text-sm bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold shadow-sm"
              >
                {adding ? 'Menambahkan...' : added ? 'Ditambahkan!' : 'Tambah ke Keranjang'}
              </button>
            </>
          ) : (
            <p className="text-sm text-red-500 font-medium">Tidak Tersedia</p>
          )}
        </div>
      </div>
    </div>
  );
}
