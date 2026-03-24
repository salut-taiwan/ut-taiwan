'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ModuleSummaryDTO } from '@/types';
import { formatIDR, cn } from '@/lib/utils';
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
  const [imageLoaded, setImageLoaded] = useState(false);
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
    <div className={cn(
      'group relative bg-white rounded-2xl overflow-hidden flex flex-col',
      'border border-slate-100',
      'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]',
      'transition-all duration-300 ease-out',
      'hover:-translate-y-1',
      'active:translate-y-0 active:scale-[0.99]'
    )}>
      {/* Top accent bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
      
      <Link href={`/modules/${module.id}`} className="block relative">
        <div className="relative bg-gradient-to-b from-slate-50 to-slate-100/50 h-52 flex items-center justify-center overflow-hidden">
          {module.cover_image_url ? (
            <>
              {/* Skeleton while loading */}
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton" />
              )}
              <Image
                src={module.cover_image_url}
                alt={module.name}
                width={120}
                height={160}
                className={cn(
                  'object-contain h-full w-auto transition-all duration-500',
                  'group-hover:scale-105',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                unoptimized
              />
            </>
          ) : (
            <div className="text-slate-300 text-center px-4">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-xs font-medium text-slate-400">No Cover</span>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors duration-300" />
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        {/* Code badge */}
        <span className={cn(
          'inline-flex self-start items-center text-xs font-mono font-semibold tracking-wider',
          'text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2.5'
        )}>
          {module.tbo_code}
        </span>
        
        <Link href={`/modules/${module.id}`}>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-700 mb-3 leading-relaxed transition-colors duration-200">
            {module.name}
          </h3>
        </Link>
        
        <div className="mt-auto pt-2">
          {module.is_available ? (
            <>
              <p className="text-lg font-bold text-indigo-700 mb-4 tabular-nums">
                {module.price_student ? formatIDR(module.price_student) : 'Hubungi Kami'}
              </p>
              <button
                onClick={handleAdd}
                disabled={adding}
                className={cn(
                  'w-full text-sm font-semibold py-2.5 rounded-xl',
                  'transition-all duration-200 ease-out',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  added
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[var(--shadow-btn-primary)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'active:scale-[0.98]'
                )}
              >
                {adding ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menambahkan...
                  </span>
                ) : added ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Ditambahkan!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah ke Keranjang
                  </span>
                )}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Tidak Tersedia
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModuleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
      {/* Top accent bar skeleton */}
      <div className="h-1 skeleton" />
      
      {/* Image skeleton */}
      <div className="h-52 skeleton" />
      
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Code badge skeleton */}
        <div className="h-6 w-20 rounded-md skeleton" />
        
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-3/4 rounded skeleton" />
        </div>
        
        <div className="mt-auto pt-3 flex flex-col gap-3">
          {/* Price skeleton */}
          <div className="h-6 w-24 rounded skeleton" />
          
          {/* Button skeleton */}
          <div className="h-10 w-full rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
