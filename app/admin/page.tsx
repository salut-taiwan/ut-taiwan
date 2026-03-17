'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ScraperRunDTO } from '@/types';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [recentRun, setRecentRun] = useState<ScraperRunDTO | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.scraper.getRuns().then(runs => {
        if (runs.length > 0) setRecentRun(runs[0]);
      });
    }
  }, [user]);

  if (isLoading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Panel Admin</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/scraper" className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Scraper</h3>
          <p className="text-sm text-slate-500 mt-1">Kelola sinkronisasi data TBO Karunika</p>
          {recentRun && (
            <p className="text-xs text-slate-400 mt-2">
              Terakhir: {formatDate(recentRun.started_at)} — {recentRun.status}
            </p>
          )}
        </Link>
        <Link href="/admin/modules" className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Manajemen Modul</h3>
          <p className="text-sm text-slate-500 mt-1">Lihat dan kelola data modul</p>
        </Link>
        <Link href="/admin/packages" className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Manajemen Paket</h3>
          <p className="text-sm text-slate-500 mt-1">Buat dan kelola paket semester</p>
        </Link>
        <Link href="/admin/orders" className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <div className="text-3xl mb-2">💳</div>
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Pesanan & Pembayaran</h3>
          <p className="text-sm text-slate-500 mt-1">Lihat pesanan dan konfirmasi pembayaran</p>
        </Link>
      </div>
    </div>
  );
}
