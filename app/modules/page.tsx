'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { ModuleSummaryDTO } from '@/types';
import ModuleCard from '@/components/catalog/ModuleCard';

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleSummaryDTO[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModuleSummaryDTO[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const LIMIT = 24;

  useEffect(() => {
    setLoading(true);
    api.modules.list(page, LIMIT).then((data: any) => {
      setModules(data.data || []);
      setTotal(data.total || 0);
    }).finally(() => setLoading(false));
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
      api.modules.search(q).then((data: any) => {
        setSearchResults(data);
      }).finally(() => setSearching(false));
    }, 400);
  }

  const displayModules = searchResults !== null ? searchResults : modules;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Semua Modul</h1>
      <p className="text-slate-500 mb-6">Cari dan temukan bahan ajar Universitas Terbuka</p>

      {/* Search */}
      <div className="relative mb-8">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Cari kode atau nama modul (contoh: ESPA4122 atau Matematika)"
          className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm text-slate-900 placeholder-slate-400"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Mencari...</div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat modul...</div>
      ) : (
        <>
          {searchResults !== null && (
            <p className="text-sm text-slate-500 mb-4">
              {searchResults.length} hasil untuk &ldquo;{searchQuery}&rdquo;
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayModules.map(mod => (
              <ModuleCard key={mod.id} module={mod} />
            ))}
          </div>

          {displayModules.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              {searchQuery ? 'Modul tidak ditemukan' : 'Belum ada modul tersedia'}
            </div>
          )}

          {/* Pagination — only show when not searching */}
          {searchResults === null && totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 text-slate-700"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Halaman {page} dari {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 text-slate-700"
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
