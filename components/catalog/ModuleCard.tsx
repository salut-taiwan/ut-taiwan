'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ModuleSummaryDTO } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cart';

interface ModuleCardProps {
  module: ModuleSummaryDTO;
  onAddedToCart?: () => void;
}

export default function ModuleCard({ module, onAddedToCart }: ModuleCardProps) {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { showToast } = useToast();
  const { syncCartCount } = useCart();

  async function handleAdd() {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setAdding(true);
    try {
      const cart = await api.cart.addItem(module.id) as any;
      setAdded(true);
      syncCartCount(cart.itemCount);
      showToast(module.is_available ? 'Modul ditambahkan ke keranjang!' : 'Modul ditambahkan sebagai permintaan!');
      onAddedToCart?.();
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      showToast((err as any)?.message || 'Gagal menambahkan ke keranjang', 'error');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className={`bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 active:scale-[0.99] transition-[box-shadow,transform] duration-200 overflow-hidden flex flex-col border-t-4 ${module.is_available && module.price_student ? 'border-t-indigo-500' : 'border-t-amber-400'}`}>
      <Link href={`/modules/${module.id}`} className="block">
        <div className="bg-[var(--surface-sunken)] h-48 flex items-center justify-center overflow-hidden">
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
            <div className="flex flex-col items-center gap-1.5 text-indigo-200 px-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-xs text-[var(--text-muted)]">Tanpa Cover</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col">
        <span className="text-xs font-mono text-indigo-600 font-semibold mb-1 tracking-caps">{module.tbo_code}</span>
        <Link href={`/modules/${module.id}`}>
          <h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2 hover:text-indigo-700 transition-colors duration-150 mb-2">{module.name}</h3>
        </Link>
        <div className="mt-auto">
          <p className={`text-base font-bold mb-3 tabular-nums ${!module.price_student ? 'text-[var(--text-muted)]' : module.is_available ? 'text-indigo-700' : 'text-amber-600'}`}>
            {module.price_student ? module.price_student_display : 'Hubungi Kami'}
          </p>
          <button
            onClick={handleAdd}
            disabled={adding}
            className={`w-full text-sm py-2.5 rounded-xl font-semibold transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5
              ${added
                ? 'bg-emerald-600 text-white shadow-sm'
                : module.is_available && module.price_student
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-px hover:shadow-[var(--shadow-sm)] shadow-[var(--shadow-btn-primary)]'
                  : 'bg-amber-500 text-white hover:bg-amber-600 hover:-translate-y-px shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-sm)]'
              }`}
          >
            {adding ? (
              <>
                <span className="border-2 border-white border-t-transparent rounded-full animate-spin w-3.5 h-3.5" />
                Menambahkan...
              </>
            ) : added ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {module.is_available && module.price_student ? 'Ditambahkan!' : 'Diminta!'}
              </>
            ) : (
              module.is_available && module.price_student ? 'Tambah ke Keranjang' : 'Minta Buku Ini'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModuleCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col border-t-4 border-t-[var(--border)]">
      <div className="h-48 skeleton" />
      <div className="p-4 flex-1 flex flex-col gap-2.5">
        <div className="h-3 w-16 rounded skeleton" />
        <div className="h-3.5 w-full rounded skeleton" />
        <div className="h-3.5 w-3/4 rounded skeleton" />
        <div className="mt-auto pt-2 flex flex-col gap-2">
          <div className="h-5 w-24 rounded skeleton" />
          <div className="h-10 w-full rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
