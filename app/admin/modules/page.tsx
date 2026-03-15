'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';

export default function AdminModulesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 30;

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    setLoading(true);
    api.modules.list(page, LIMIT).then((data: any) => {
      setModules(data.data || []);
      setTotal(data.total || 0);
    }).finally(() => setLoading(false));
  }, [page, user]);

  if (isLoading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Admin</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manajemen Modul</h1>
          <p className="text-sm text-slate-500">{total} modul total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Kode</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Nama</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Edisi</th>
                <th className="text-right px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Harga Mhs</th>
                <th className="text-center px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map(mod => (
                <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-semibold">{mod.tbo_code}</td>
                  <td className="px-4 py-3 text-slate-900 max-w-xs truncate">{mod.name}</td>
                  <td className="px-4 py-3 text-slate-500">{mod.edition || '-'}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{mod.price_student ? formatIDR(mod.price_student) : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      mod.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {mod.is_available ? 'Tersedia' : 'Tidak'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 text-slate-700">
            Sebelumnya
          </button>
          <span className="px-4 py-2 text-sm text-slate-600">Halaman {page} dari {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 text-slate-700">
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
