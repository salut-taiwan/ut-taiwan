'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';

export default function AdminPackagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ linked: number; packages: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.packages.list().then((data: any) => setPackages(data)).finally(() => setLoading(false));
  }, [user]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await api.packages.sync();
      setSyncResult(result);
      // Reload package list
      const data: any = await api.packages.list();
      setPackages(data);
    } catch (e: any) {
      setSyncError(e.message || 'Gagal sinkronisasi');
    } finally {
      setSyncing(false);
    }
  }

  if (isLoading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Admin</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manajemen Paket</h1>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {syncing ? 'Menyinkronkan...' : 'Sinkronisasi Paket'}
        </button>
      </div>

      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 text-sm text-emerald-700">
          Sinkronisasi selesai: {syncResult.linked} modul ditautkan ke {syncResult.packages} paket.
        </div>
      )}
      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
          {syncError}
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 text-sm text-indigo-700">
        Paket dibuat manual oleh admin. Gunakan tombol &ldquo;Sinkronisasi Paket&rdquo; untuk menautkan modul ke paket
        berdasarkan data mata kuliah dan modul terkini di database.
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat...</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Belum ada paket. Buat paket pertama via SQL atau Supabase dashboard.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">Semester {pkg.semester}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  pkg.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{pkg.name}</h3>
              {pkg.programs && <p className="text-xs text-slate-500 mb-3">{pkg.programs.name}</p>}
              <p className="text-sm font-bold text-indigo-700">{formatIDR(pkg.totalPrice)}</p>
              <p className="text-xs text-slate-400">{(pkg.package_modules || []).length} modul</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
