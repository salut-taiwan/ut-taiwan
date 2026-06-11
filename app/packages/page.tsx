'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { PackageDTO, ProgramDTO } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cart';

const PAGE_SIZES = [9, 18, 36];

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(9);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { refreshCart } = useCart();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchMountedRef = useRef(false);

  useEffect(() => {
    api.catalog.getPrograms().then(data => setPrograms(data));
  }, []);

  // Reset offset when any filter/search/limit changes
  useEffect(() => {
    setOffset(0);
  }, [selectedProgram, selectedSemester, search, limit]);

  // Non-search changes fetch immediately.
  useEffect(() => {
    fetchPackages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram, selectedSemester, limit, offset]);

  // Search typing is debounced (400ms). Skip the initial-mount run since the
  // non-search effect already kicks off the first fetch.
  useEffect(() => {
    if (!searchMountedRef.current) {
      searchMountedRef.current = true;
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchPackages(), 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function fetchPackages() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);
    try {
      const params: Parameters<typeof api.packages.list>[0] = {
        limit: String(limit),
        offset: String(offset),
      };
      if (selectedProgram) params.programId = selectedProgram;
      if (selectedSemester) params.semester = selectedSemester;
      if (search.trim()) params.search = search.trim();

      const data = await api.packages.list(params, controller.signal);
      if (controller.signal.aborted) return;
      setPackages(data.rows);
      setTotal(data.total);
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function handleAddPackage(pkg: PackageDTO) {
    if (!user) { window.location.href = '/login'; return; }
    setAdding(pkg.id);
    try {
      await api.cart.addPackage(pkg.id);
      await refreshCart();
      showToast(`Paket ditambahkan. ${pkg.summary_label ?? ''}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal menambahkan paket', 'error');
    } finally {
      setAdding(null);
    }
  }

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + packages.length, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;
  const hasActiveFilters = !!search || !!selectedProgram || !!selectedSemester;

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Paket Modul</h1>
      <p className="text-[var(--text-body)] mb-6">Paket modul lengkap per semester yang telah dikurasi</p>

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari paket berdasarkan nama atau deskripsi..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border-default)] rounded-lg bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[var(--ring-focus)] transition-[border-color,box-shadow] duration-150"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
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
        {hasActiveFilters && (
          <button
            onClick={() => { setSearch(''); setSelectedProgram(''); setSelectedSemester(''); }}
            className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-sunken)] transition-colors"
          >
            Reset
          </button>
        )}
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
            onClick={() => fetchPackages()}
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
        <>
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
                      <p className="text-lg font-bold text-indigo-700">{pkg.totalPrice_display}</p>
                    </div>
                    <button
                      onClick={() => handleAddPackage(pkg)}
                      disabled={adding === pkg.id}
                      className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold shadow-sm"
                    >
                      {adding === pkg.id ? 'Menambahkan...' : 'Tambah ke Keranjang'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - only render when there's more than one page worth of results */}
          {total > limit && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-8 px-1 text-sm text-[var(--text-muted)]">
            <span>
              Menampilkan <span className="font-semibold text-[var(--foreground)]">{rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}</span> dari <span className="font-semibold text-[var(--foreground)]">{total.toLocaleString()}</span>
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs">
                Per halaman:
                <select
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                  className="ml-2 px-2 py-1 text-xs border border-[var(--border-default)] rounded-md bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-indigo-400"
                >
                  {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button
                onClick={() => setOffset(o => Math.max(0, o - limit))}
                disabled={!canPrev}
                className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-sunken)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setOffset(o => o + limit)}
                disabled={!canNext}
                className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-sunken)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}
