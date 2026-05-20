'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { ModuleSummaryDTO } from '@/types';
import ModuleCard, { ModuleCardSkeleton } from '@/components/catalog/ModuleCard';

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleSummaryDTO[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModuleSummaryDTO[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const LIMIT = 24;

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.modules.list(page, LIMIT).then(data => {
      setModules(data.data || []);
      setTotal(data.total || 0);
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [page]);

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim() || q.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      api.modules.search(q).then(data => {
        setSearchResults(data);
      }).catch(() => setSearchResults([])).finally(() => setSearching(false));
    }, 400);
  }

  const displayModules = searchResults !== null ? searchResults : modules;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Semua Modul</h1>
      <p className="text-[var(--text-body)] mb-6">Cari dan temukan bahan ajar Universitas Terbuka</p>

      {/* Search */}
      <div className="relative mb-8">
        <label htmlFor="module-search" className="sr-only">Cari modul</label>
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="module-search"
          type="text"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Cari kode atau nama modul (contoh: ESPA4122 atau Matematika)"
          className="w-full pl-12 pr-4 py-3.5 border border-[var(--border-default)] rounded-[12px] focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)] bg-[var(--surface)] shadow-[var(--shadow-xs)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-150"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">Mencari...</div>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-[var(--text-muted)]">Gagal memuat modul.</p>
          <button
            onClick={() => { setPage(1); setError(false); setLoading(true); api.modules.list(1, LIMIT).then(data => { setModules(data.data || []); setTotal(data.total || 0); }).catch(() => setError(true)).finally(() => setLoading(false)); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Coba lagi
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ModuleCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {searchResults !== null && (
            <p className="text-sm text-[var(--text-body)] mb-4">
              {searchResults.length} hasil untuk &ldquo;{searchQuery}&rdquo;
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayModules.map(mod => (
              <ModuleCard key={mod.id} module={mod} />
            ))}
          </div>

          {displayModules.length === 0 && (
            <div className="flex flex-col items-center gap-3 text-center py-20 max-w-xs mx-auto">
              <svg className="w-16 h-16 text-[var(--border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {searchQuery ? 'Modul tidak ditemukan' : 'Belum ada modul tersedia'}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {searchQuery ? 'Coba kata kunci lain atau cari berdasarkan kode modul' : 'Coba lagi nanti'}
              </p>
            </div>
          )}

          {/* Pagination — only show when not searching */}
          {searchResults === null && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[var(--border-default)] rounded-lg text-sm font-medium text-[var(--text-body)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-[background-color,border-color,color] duration-150"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-2 text-sm text-[var(--text-body)]">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-[var(--border-default)] rounded-lg text-sm font-medium text-[var(--text-body)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-[background-color,border-color,color] duration-150"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
