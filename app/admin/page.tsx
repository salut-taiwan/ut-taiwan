'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentRun, setRecentRun] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.scraper.getRuns().then((runs: any) => {
        if (runs.length > 0) setRecentRun(runs[0]);
      });
    }
  }, [user]);

  if (isLoading) return <div className="text-center py-16 text-gray-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/scraper" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Scraper</h3>
          <p className="text-sm text-gray-500 mt-1">Kelola sinkronisasi data TBO Karunika</p>
          {recentRun && (
            <p className="text-xs text-gray-400 mt-2">
              Terakhir: {formatDate(recentRun.started_at)} — {recentRun.status}
            </p>
          )}
        </Link>
        <Link href="/admin/modules" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Manajemen Modul</h3>
          <p className="text-sm text-gray-500 mt-1">Lihat dan kelola data modul</p>
        </Link>
        <Link href="/admin/packages" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Manajemen Paket</h3>
          <p className="text-sm text-gray-500 mt-1">Buat dan kelola paket semester</p>
        </Link>
      </div>
    </div>
  );
}
