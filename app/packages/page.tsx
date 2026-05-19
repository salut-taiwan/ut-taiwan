'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PackageDTO, FacultyDTO, ProgramDTO } from '@/types';
import { formatIDR } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cart';

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const { showToast } = useToast();
  const { refreshCart } = useCart();

  useEffect(() => {
    api.catalog.getPrograms().then((data: any) => setPrograms(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.packages.list(
      selectedProgram || undefined,
      selectedSemester ? parseInt(selectedSemester) : undefined
    ).then((data: any) => setPackages(data)).catch(() => setError(true)).finally(() => setLoading(false));
  }, [selectedProgram, selectedSemester]);

  async function handleAddPackage(pkg: PackageDTO) {
    const token = localStorage.getItem('ut_token');
    if (!token) { window.location.href = '/login'; return; }
    setAdding(pkg.id);
    try {
      await api.cart.addPackage(pkg.id);
      await refreshCart();
      const total = (pkg.package_modules || []).length;
      const available = (pkg.package_modules || []).filter((pm: any) => pm.modules.is_available).length;
      const requestCount = total - available;
      if (requestCount === 0) {
        showToast(`${available} modul ditambahkan ke keranjang!`);
      } else if (available === 0) {
        showToast(`${total} modul ditambahkan sebagai permintaan!`);
      } else {
        showToast(`${available} modul ditambahkan, ${requestCount} sebagai permintaan!`);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAdding(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Paket Semester</h1>
      <p className="text-[var(--text-body)] mb-6">Paket modul lengkap per semester yang telah dikurasi</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={selectedProgram}
          onChange={e => setSelectedProgram(e.target.value)}
          className="border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
        >
          <option value="">Semua Program Studi</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={selectedSemester}
          onChange={e => setSelectedSemester(e.target.value)}
          className="border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
        >
          <option value="">Semua Semester</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="skeleton h-20 rounded-none" />
              <div className="p-5 space-y-3">
                <div className="skeleton h-3 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="skeleton h-6 w-20 rounded" />
                  <div className="skeleton h-8 w-28 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-[var(--text-muted)] mb-4">Gagal memuat paket. Coba lagi.</p>
          <button
            onClick={() => { setError(false); setLoading(true); api.packages.list(selectedProgram || undefined, selectedSemester ? parseInt(selectedSemester) : undefined).then((data: any) => setPackages(data)).catch(() => setError(true)).finally(() => setLoading(false)); }}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Muat Ulang
          </button>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p>Belum ada paket tersedia untuk filter yang dipilih.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
                <p className="text-indigo-200 text-xs font-medium mb-1">Semester {pkg.semester}</p>
                <h3 className="text-white font-bold leading-snug">{pkg.name}</h3>
                {pkg.programs && <p className="text-indigo-200 text-xs mt-1">{pkg.programs.name}</p>}
              </div>
              <div className="p-5">
                {pkg.description && <p className="text-sm text-[var(--text-body)] mb-3">{pkg.description}</p>}
                <div className="mb-4">
                  <p className="text-xs text-[var(--text-muted)] mb-2">Modul dalam paket ({(pkg.package_modules || []).length} modul):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(pkg.package_modules || []).map(pm => (
                      <div key={pm.modules.id} className="text-xs text-[var(--text-body)] flex items-center gap-1.5">
                        <span className="font-mono text-[var(--text-muted)]">{pm.modules.tbo_code}</span>
                        <span className="truncate">{pm.modules.name}</span>
                        {!pm.modules.is_available && <span className="text-red-400 flex-shrink-0">(N/A)</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Total</p>
                    <p className="text-lg font-bold text-indigo-700">{formatIDR(pkg.totalPrice)}</p>
                  </div>
                  <button
                    onClick={() => handleAddPackage(pkg)}
                    disabled={adding === pkg.id}
                    className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold shadow-sm"
                  >
                    {adding === pkg.id ? 'Menambahkan...' : 'Tambah Paket'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
