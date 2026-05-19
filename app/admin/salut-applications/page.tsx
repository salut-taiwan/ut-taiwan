'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { AdminSalutApplicationDTO } from '@/types';
import { formatDate } from '@/lib/utils';

type Tab = 'pending' | 'all';

export default function SalutApplicationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('pending');
  const [applications, setApplications] = useState<AdminSalutApplicationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProof, setLoadingProof] = useState<string | null>(null);

  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingInProgress, setRejectingInProgress] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await api.admin.listSalutApplications(tab === 'all' ? 'all' : 'pending');
      setApplications(data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (user?.role === 'admin') { setSelectedIds(new Set()); loadApplications(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user?.role]);

  async function handleViewProof(userId: string) {
    setLoadingProof(userId);
    try {
      const { signedUrl } = await api.admin.getSalutProofUrl(userId);
      window.open(signedUrl, '_blank', 'noopener');
    } catch (err) {
      alert((err as Error).message || 'Gagal memuat bukti');
    } finally {
      setLoadingProof(null);
    }
  }

  async function handleApprove(userId: string) {
    setApprovingIds(prev => new Set(prev).add(userId));
    try {
      await api.admin.approveSalut(userId);
      setApplications(prev => prev.filter(a => a.id !== userId));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    } catch (err) {
      alert((err as Error).message || 'Gagal menyetujui');
    } finally {
      setApprovingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
  }

  async function handleRejectConfirm() {
    if (!rejectingId || !rejectReason.trim()) return;
    setRejectingInProgress(true);
    try {
      await api.admin.rejectSalut(rejectingId, rejectReason.trim());
      setApplications(prev => prev.filter(a => a.id !== rejectingId));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(rejectingId!); return s; });
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      alert((err as Error).message || 'Gagal menolak');
    } finally {
      setRejectingInProgress(false);
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Setujui ${selectedIds.size} permohonan sekaligus?`)) return;
    setBulkApproving(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try { await api.admin.approveSalut(id); } catch {}
    }
    setBulkApproving(false);
    setSelectedIds(new Set());
    loadApplications();
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleSelectAll() {
    const pendingIds = applications.filter(a => !approvingIds.has(a.id)).map(a => a.id);
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  }

  if (isLoading) return <div className="text-center py-16 text-[var(--text-muted)]">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  const showCheckboxes = tab === 'pending';
  const pendingCount = applications.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Permohonan SALUT</h1>
          <p className="text-sm text-[var(--text-body)] mt-1">Verifikasi dan setujui permohonan keanggotaan SALUT</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface-sunken)] rounded-xl p-1 w-fit mb-6">
        {(['pending', 'all'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-[background-color,color,box-shadow] duration-150 flex items-center gap-2 ${
              tab === t
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {t === 'pending' ? 'Menunggu' : 'Semua'}
            {t === 'pending' && pendingCount > 0 && tab === 'pending' && (
              <span className="bg-amber-400 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {showCheckboxes && selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.size} dipilih</span>
          <button
            onClick={handleBulkApprove}
            disabled={bulkApproving}
            className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {bulkApproving ? 'Memproses...' : `Setujui ${selectedIds.size} Permohonan`}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-sm text-indigo-600 hover:underline ml-auto">
            Batalkan Pilihan
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl skeleton" />)}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <svg className="w-14 h-14 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{tab === 'pending' ? 'Tidak ada permohonan yang menunggu' : 'Belum ada permohonan'}</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
                {showCheckboxes && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === applications.filter(a => !approvingIds.has(a.id)).length && applications.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-[var(--border-default)] text-indigo-600"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Nama</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">NIM</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)] hidden md:table-cell">Program</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)] hidden lg:table-cell">Tanggal Daftar</th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--foreground)]">Bukti</th>
                {tab === 'pending' && <th className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {applications.map(app => {
                const busy = approvingIds.has(app.id);
                const isRejecting = rejectingId === app.id;
                return (
                  <tr key={app.id} className={`border-b border-[var(--border-subtle)] last:border-0 ${busy ? 'opacity-50' : ''}`}>
                    {showCheckboxes && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(app.id)}
                          onChange={() => toggleSelect(app.id)}
                          disabled={busy}
                          className="h-4 w-4 rounded border-[var(--border-default)] text-indigo-600"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--foreground)]">{app.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{app.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)]">{app.nim ?? '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--text-body)]">
                      {app.programs?.code ?? '—'}
                      {app.current_semester && <span className="ml-1 text-[var(--text-muted)]">Sem {app.current_semester}</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-[var(--text-body)] text-xs">
                      {formatDate(app.salut_applied_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewProof(app.id)}
                        disabled={loadingProof === app.id}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline disabled:opacity-50 flex items-center gap-1"
                      >
                        {loadingProof === app.id ? (
                          <span className="border-2 border-indigo-400 border-t-transparent rounded-full animate-spin w-3 h-3" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                        Lihat
                      </button>
                    </td>
                    {tab === 'pending' && (
                      <td className="px-4 py-3 text-right">
                        {isRejecting ? (
                          <div className="flex items-center gap-2 justify-end">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Alasan penolakan..."
                              maxLength={500}
                              className="text-xs border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 w-48 text-[var(--foreground)] bg-[var(--surface)] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                            <button
                              onClick={handleRejectConfirm}
                              disabled={rejectingInProgress || !rejectReason.trim()}
                              className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              {rejectingInProgress ? '...' : 'Tolak'}
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)]"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleApprove(app.id)}
                              disabled={busy}
                              className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {busy ? '...' : 'Setujui'}
                            </button>
                            <button
                              onClick={() => { setRejectingId(app.id); setRejectReason(''); }}
                              disabled={busy}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
