'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { AdminUserDTO, ProgramDTO } from '@/types';
import { cn } from '@/lib/utils';
import { useAdminTable } from '@/hooks/useAdminTable';
import { useToast } from '@/components/ui/Toast';

type SortCol = 'name' | 'nim' | 'email' | 'created_at' | 'current_semester' | 'salut_status' | 'program';
type SalutStatusFilter = '' | 'none' | 'pending' | 'approved' | 'rejected' | 'expired';
type VerifiedFilter = '' | 'true' | 'false';

interface Filters {
  salut_status: SalutStatusFilter;
  is_verified: VerifiedFilter;
  program_id: string;
  semester: string;
}

const EMPTY_FILTERS: Filters = { salut_status: '', is_verified: '', program_id: '', semester: '' };

const SALUT_STATUS_OPTIONS: { value: SalutStatusFilter; label: string }[] = [
  { value: '',         label: 'Semua status SALUT' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending',  label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired',  label: 'Expired' },
  { value: 'none',     label: 'None' },
];

const VERIFIED_OPTIONS: { value: VerifiedFilter; label: string }[] = [
  { value: '',      label: 'Semua verifikasi' },
  { value: 'true',  label: 'Terverifikasi' },
  { value: 'false', label: 'Belum verifikasi' },
];

const PAGE_SIZES = [25, 50, 100];

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={cn('w-3 h-3 ml-1 inline-block transition-colors', active ? 'text-indigo-600' : 'text-[var(--border-default)]')}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {active && dir === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      }
    </svg>
  );
}

const SELECT_CLASS = 'px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[var(--ring-focus)] transition-[border-color,box-shadow] duration-150';

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulking, setBulking] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.catalog.getPrograms().then(setPrograms).catch(() => {});
  }, [user]);

  const fetchRows = useCallback(async (
    params: { search: string; filters: Filters; sort: { col: string; dir: 'asc' | 'desc' }; limit: number; offset: number },
    signal: AbortSignal
  ) => {
    const apiParams: Parameters<typeof api.admin.listUsers>[0] = {
      sort: params.sort.col as SortCol,
      dir: params.sort.dir,
      limit: String(params.limit),
      offset: String(params.offset),
    };
    if (params.search.trim()) apiParams.search = params.search.trim();
    if (params.filters.salut_status) apiParams.salut_status = params.filters.salut_status;
    if (params.filters.is_verified) apiParams.is_verified = params.filters.is_verified;
    if (params.filters.program_id) apiParams.program_id = params.filters.program_id;
    if (params.filters.semester) apiParams.semester = params.filters.semester;
    const data = await api.admin.listUsers(apiParams, signal);
    return { rows: data.rows, total: data.total };
  }, []);

  const { rows: users, total, loading, search, setSearch, filters, setFilters, sort, setSort, limit, setLimit, offset, setOffset, refetch } = useAdminTable<AdminUserDTO, Filters>({
    fetchRows,
    defaultFilters: EMPTY_FILTERS,
    defaultSort: { col: 'created_at', dir: 'desc' },
    onError: (err) => showToast(err.message || 'Gagal memuat data', 'error'),
  });

  // Clear row selection whenever the data set changes
  useEffect(() => { setSelectedIds(new Set()); }, [users]);

  async function handleToggleSalut(u: AdminUserDTO) {
    setToggling(u.id);
    try {
      await api.admin.updateUserSalut(u.id, !u.is_salut);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setToggling(null);
    }
  }

  async function handleBulkSalut(is_salut: boolean) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulking(true);
    try {
      await api.admin.bulkUpdateUserSalut(ids, is_salut);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setBulking(false);
    }
  }

  function toggleSort(col: SortCol) {
    setSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map(u => u.id)));
    }
  }

  function resetAll() {
    setSearch('');
    setFilters(EMPTY_FILTERS);
    setSort({ col: 'created_at', dir: 'desc' });
  }

  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const hasActiveFilters = !!search || filters.salut_status || filters.is_verified || filters.program_id || filters.semester;

  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + users.length, total);
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  if (isLoading) return <div className="text-center py-16 text-[var(--text-muted)]">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Admin</Link>
        <div className="flex items-center justify-between mt-1">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Panel Admin</span>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mt-0.5">Manajemen Mahasiswa</h1>
          </div>
          {!loading && (
            <span className="text-sm text-[var(--text-muted)]">{total.toLocaleString()} mahasiswa</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, email, NIM, telepon, atau program..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border-default)] rounded-lg bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[var(--ring-focus)] transition-[border-color,box-shadow] duration-150"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAll}
              className="px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-sunken)] transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filters.salut_status}
            onChange={e => setFilters(f => ({ ...f, salut_status: e.target.value as SalutStatusFilter }))}
            className={SELECT_CLASS}
          >
            {SALUT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={filters.is_verified}
            onChange={e => setFilters(f => ({ ...f, is_verified: e.target.value as VerifiedFilter }))}
            className={SELECT_CLASS}
          >
            {VERIFIED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={filters.program_id}
            onChange={e => setFilters(f => ({ ...f, program_id: e.target.value }))}
            className={SELECT_CLASS}
          >
            <option value="">Semua program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>

          <select
            value={filters.semester}
            onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
            className={SELECT_CLASS}
          >
            <option value="">Semua semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <option key={n} value={String(n)}>Semester {n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
          <span className="font-semibold text-indigo-800 flex-1">{selectedIds.size} mahasiswa dipilih (halaman ini)</span>
          <button
            onClick={() => handleBulkSalut(true)}
            disabled={bulking}
            className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {bulking ? '...' : 'Tandai SALUT'}
          </button>
          <button
            onClick={() => handleBulkSalut(false)}
            disabled={bulking}
            className="px-3 py-1.5 bg-[var(--surface)] text-[var(--text-body)] border border-[var(--border-default)] text-xs font-semibold rounded-lg hover:bg-[var(--surface-sunken)] disabled:opacity-50 transition-colors"
          >
            {bulking ? '...' : 'Cabut SALUT'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            disabled={bulking}
            className="px-3 py-1.5 text-[var(--text-muted)] text-xs font-semibold rounded-lg hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Memuat...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            {hasActiveFilters ? 'Tidak ada mahasiswa yang cocok' : 'Belum ada mahasiswa terdaftar'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-sunken)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="rounded border-[var(--border-default)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleSort('name')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                      Nama <SortIcon active={sort.col === 'name'} dir={sort.dir} />
                    </button>
                    <button onClick={() => toggleSort('email')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                      Email <SortIcon active={sort.col === 'email'} dir={sort.dir} />
                    </button>
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold">
                  <button onClick={() => toggleSort('nim')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                    NIM <SortIcon active={sort.col === 'nim'} dir={sort.dir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold hidden md:table-cell">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleSort('program')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                      Program <SortIcon active={sort.col === 'program'} dir={sort.dir} />
                    </button>
                    <button onClick={() => toggleSort('current_semester')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                      Semester <SortIcon active={sort.col === 'current_semester'} dir={sort.dir} />
                    </button>
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold">
                  <button onClick={() => toggleSort('salut_status')} className="flex items-center mx-auto hover:text-[var(--foreground)] transition-colors">
                    SALUT <SortIcon active={sort.col === 'salut_status'} dir={sort.dir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold hidden lg:table-cell">
                  <button onClick={() => toggleSort('created_at')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                    Daftar <SortIcon active={sort.col === 'created_at'} dir={sort.dir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {users.map(u => (
                <tr
                  key={u.id}
                  className={cn(
                    'hover:bg-[var(--surface-sunken)] transition-colors',
                    selectedIds.has(u.id) && 'bg-indigo-50/60'
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="rounded border-[var(--border-default)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--foreground)]">{u.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{u.email}</p>
                    {u.is_verified === false && (
                      <p className="text-[10px] text-amber-700 mt-0.5 uppercase tracking-wide">Belum verifikasi</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-body)]">
                    {u.nim || <span className="text-[var(--text-muted)] not-italic">-</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.programs ? (
                      <>
                        <p className="text-[var(--text-body)] text-xs">{u.programs.name}</p>
                        {u.current_semester && (
                          <p className="text-[var(--text-muted)] text-xs mt-0.5">Semester {u.current_semester}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-[var(--text-muted)] text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleSalut(u)}
                      disabled={toggling === u.id || bulking}
                      title={u.is_salut ? 'Klik untuk cabut status SALUT' : 'Klik untuk tandai sebagai SALUT'}
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full border transition-[background-color,color,border-color,opacity] duration-150 disabled:opacity-50',
                        u.is_salut
                          ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                          : u.salut_status === 'expired'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : u.salut_status === 'pending'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              : u.salut_status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                      )}
                    >
                      {toggling === u.id
                        ? '...'
                        : u.is_salut
                          ? 'SALUT'
                          : u.salut_status === 'expired'
                            ? 'Expired'
                            : u.salut_status === 'pending'
                              ? 'Pending'
                              : u.salut_status === 'rejected'
                                ? 'Rejected'
                                : 'Non-SALUT'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs hidden lg:table-cell">
                    {u.created_at_display}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination footer */}
      {!loading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1 text-sm text-[var(--text-muted)]">
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
    </div>
  );
}
