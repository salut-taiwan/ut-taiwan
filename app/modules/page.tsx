'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { ModuleSummaryDTO } from '@/types';
import ModuleCard, { ModuleCardSkeleton } from '@/components/catalog/ModuleCard';
import { cn } from '@/lib/utils';

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleSummaryDTO[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModuleSummaryDTO[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Semua Modul</h1>
        <p className="text-slate-500 text-lg">Cari dan temukan bahan ajar Universitas Terbuka</p>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <div className={cn(
          'relative flex items-center transition-all duration-300',
          searchFocused && 'transform scale-[1.01]'
        )}>
          <div className={cn(
            'absolute left-4 transition-colors duration-200',
            searchFocused ? 'text-indigo-500' : 'text-slate-400'
          )}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Cari kode atau nama modul (contoh: ESPA4122 atau Matematika)"
            className={cn(
              'w-full pl-12 pr-12 py-4 rounded-2xl',
              'bg-white border-2 text-slate-900',
              'placeholder:text-slate-400',
              'transition-all duration-300',
              'focus:outline-none',
              searchFocused
                ? 'border-indigo-400 shadow-[0_0_0_4px_rgba(10,69,149,0.1)]'
                : 'border-slate-200 shadow-[var(--shadow-card)] hover:border-slate-300'
            )}
          />
          {/* Search status */}
          <div className="absolute right-4 flex items-center gap-2">
            {searching && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="hidden sm:inline">Mencari...</span>
              </div>
            )}
            {searchQuery && !searching && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in-up">
              <ModuleCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <>
          {searchResults !== null && (
            <div className="flex items-center gap-3 mb-6 animate-fade-in">
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>{searchResults.length} hasil untuk &ldquo;{searchQuery}&rdquo;</span>
              </div>
              <button
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Hapus filter
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {displayModules.map((mod, index) => (
              <div 
                key={mod.id} 
                style={{ animationDelay: `${index * 30}ms` }}
                className="animate-fade-in-up"
              >
                <ModuleCard module={mod} />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {displayModules.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {searchQuery ? 'Modul Tidak Ditemukan' : 'Belum Ada Modul'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? `Tidak ada modul yang cocok dengan pencarian "${searchQuery}". Coba kata kunci lain.`
                  : 'Belum ada modul yang tersedia saat ini.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Lihat semua modul
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {searchResults === null && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-12">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium',
                  'border border-slate-200 bg-white',
                  'transition-all duration-200',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm',
                  'active:scale-[0.98]'
                )}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100">
                <span className="text-sm font-semibold text-indigo-600">{page}</span>
                <span className="text-sm text-slate-500">dari</span>
                <span className="text-sm font-medium text-slate-700">{totalPages}</span>
              </div>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium',
                  'border border-slate-200 bg-white',
                  'transition-all duration-200',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm',
                  'active:scale-[0.98]'
                )}
              >
                Selanjutnya
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
