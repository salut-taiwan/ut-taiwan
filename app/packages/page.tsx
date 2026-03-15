'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PackageDTO, FacultyDTO, ProgramDTO } from '@/types';
import { formatIDR } from '@/lib/utils';
import Link from 'next/link';

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    api.catalog.getPrograms().then((data: any) => setPrograms(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.packages.list(
      selectedProgram || undefined,
      selectedSemester ? parseInt(selectedSemester) : undefined
    ).then((data: any) => setPackages(data)).finally(() => setLoading(false));
  }, [selectedProgram, selectedSemester]);

  async function handleAddPackage(packageId: string) {
    const token = localStorage.getItem('ut_token');
    if (!token) { window.location.href = '/login'; return; }
    setAdding(packageId);
    try {
      const result: any = await api.cart.addPackage(packageId);
      alert(result.message);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Paket Semester</h1>
      <p className="text-gray-500 mb-6">Paket modul lengkap per semester yang telah dikurasi</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={selectedProgram}
          onChange={e => setSelectedProgram(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Semua Program Studi</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={selectedSemester}
          onChange={e => setSelectedSemester(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Semua Semester</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Memuat paket...</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Belum ada paket tersedia untuk filter yang dipilih.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-blue-600 px-5 py-4">
                <p className="text-blue-100 text-xs font-medium mb-1">Semester {pkg.semester}</p>
                <h3 className="text-white font-bold leading-snug">{pkg.name}</h3>
                {pkg.programs && <p className="text-blue-200 text-xs mt-1">{pkg.programs.name}</p>}
              </div>
              <div className="p-5">
                {pkg.description && <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>}
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Modul dalam paket ({(pkg.package_modules || []).length} modul):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(pkg.package_modules || []).map(pm => (
                      <div key={pm.modules.id} className="text-xs text-gray-600 flex items-center gap-1.5">
                        <span className="font-mono text-gray-400">{pm.modules.tbo_code}</span>
                        <span className="truncate">{pm.modules.name}</span>
                        {!pm.modules.is_available && <span className="text-red-400 flex-shrink-0">(N/A)</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-bold text-gray-900">{formatIDR(pkg.totalPrice)}</p>
                  </div>
                  <button
                    onClick={() => handleAddPackage(pkg.id)}
                    disabled={adding === pkg.id}
                    className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
