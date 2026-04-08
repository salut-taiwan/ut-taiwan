'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AdminUserDTO } from '@/types';
import { cn } from '@/lib/utils';

type SalutFilter = 'all' | 'salut' | 'non';
type SortCol = 'created_at' | 'name' | 'nim';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
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

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [salutFilter, setSalutFilter] = useState<SalutFilter>('all');
  const [sort, setSort] = useState<{ col: SortCol; dir: SortDir }>({ col: 'created_at', dir: 'desc' });
  const [toggling, setToggling] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchUsers(), search ? 400 : 0);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, salutFilter, sort, user]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        sort: sort.col,
        dir: sort.dir,
      };
      if (search.trim()) params.search = search.trim();
      if (salutFilter === 'salut') params.salut = 'true';
      if (salutFilter === 'non') params.salut = 'false';
      const data = await api.admin.listUsers(params);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSalut(u: AdminUserDTO) {
    setToggling(u.id);
    // Optimistic update
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_salut: !u.is_salut } : x));
    try {
      await api.admin.updateUserSalut(u.id, !u.is_salut);
    } catch (err) {
      // Revert on failure
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_salut: u.is_salut } : x));
      alert((err as Error).message);
    } finally {
      setToggling(null);
    }
  }

  function toggleSort(col: SortCol) {
    setSort(prev =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' }
    );
  }

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
            <span className="text-sm text-[var(--text-muted)]">{users.length} mahasiswa</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
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
            placeholder="Cari nama, email, atau NIM..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border-default)] rounded-lg bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[var(--ring-focus)] transition-[border-color,box-shadow] duration-150"
          />
        </div>

        {/* SALUT filter */}
        <div className="flex gap-1 bg-[var(--surface-sunken)] rounded-lg p-1">
          {(['all', 'salut', 'non'] as SalutFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setSalutFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-[background-color,color,box-shadow] duration-150',
                salutFilter === f
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              )}
            >
              {f === 'all' ? 'Semua' : f === 'salut' ? 'SALUT' : 'Non-SALUT'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Memuat...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            {search || salutFilter !== 'all' ? 'Tidak ada mahasiswa yang cocok' : 'Belum ada mahasiswa terdaftar'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-sunken)] border-b border-[var(--border)]">
              <tr>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold">
                  <button onClick={() => toggleSort('name')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                    Nama & Email <SortIcon active={sort.col === 'name'} dir={sort.dir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold">
                  <button onClick={() => toggleSort('nim')} className="flex items-center hover:text-[var(--foreground)] transition-colors">
                    NIM <SortIcon active={sort.col === 'nim'} dir={sort.dir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold hidden md:table-cell">
                  Program / Semester
                </th>
                <th className="text-center px-4 py-3 text-[var(--text-muted)] text-xs uppercase tracking-wide font-semibold">
                  SALUT
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
                <tr key={u.id} className="hover:bg-[var(--surface-sunken)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--foreground)]">{u.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-body)]">
                    {u.nim || <span className="text-[var(--text-muted)] not-italic">—</span>}
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
                      <span className="text-[var(--text-muted)] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleSalut(u)}
                      disabled={toggling === u.id}
                      title={u.is_salut ? 'Klik untuk cabut status SALUT' : 'Klik untuk tandai sebagai SALUT'}
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full border transition-[background-color,color,border-color,opacity] duration-150 disabled:opacity-50',
                        u.is_salut
                          ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                      )}
                    >
                      {toggling === u.id ? '...' : u.is_salut ? 'SALUT' : 'Non-SALUT'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs hidden lg:table-cell">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
