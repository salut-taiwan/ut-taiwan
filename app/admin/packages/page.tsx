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

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.packages.list().then((data: any) => setPackages(data)).finally(() => setLoading(false));
  }, [user]);

  if (isLoading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Admin</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manajemen Paket</h1>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 text-sm text-indigo-700">
        Paket dibuat manual oleh admin. Hubungkan program studi + semester + daftar modul untuk membuat paket baru.
        Fitur CRUD paket akan tersedia di versi selanjutnya.
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
