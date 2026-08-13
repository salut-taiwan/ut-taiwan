'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type { AdminSksPaymentDTO, SksPaymentTone } from '@/types';
import { useDismissOnEscape } from '@/hooks/useDismissOnEscape';

type Tab = 'pending' | 'all';

const TONE_CLASSES: Record<SksPaymentTone, string> = {
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--border)]',
};

export default function AdminSksPaymentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('pending');
  const [rows, setRows] = useState<AdminSksPaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingInProgress, setRejectingInProgress] = useState(false);

  // Matches the backdrop's guard: an in-flight rejection must not be
  // dismissed half-sent.
  useDismissOnEscape(Boolean(rejectingId), () => {
    if (!rejectingInProgress) setRejectingId(null);
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.admin.listSksPayments(tab === 'all' ? 'all' : 'pending');
      setRows(data);
    } catch (err) {
      showToast((err as Error).message || 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  }, [tab, showToast]);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user?.role, load]);

  async function openSignedUrl(rowId: string, kind: 'slip' | 'proof') {
    setLoadingFile(`${rowId}:${kind}`);
    try {
      const { signedUrl } = kind === 'slip'
        ? await api.admin.getSksSlipUrl(rowId)
        : await api.admin.getSksProofUrl(rowId);
      window.open(signedUrl, '_blank', 'noopener');
    } catch (err) {
      showToast((err as Error).message || 'Gagal memuat file', 'error');
    } finally {
      setLoadingFile(null);
    }
  }

  async function handleComplete(rowId: string) {
    setCompletingId(rowId);
    try {
      await api.admin.completeSks(rowId);
      showToast('Ditandai selesai. Email konfirmasi dikirim.');
      load();
    } catch (err) {
      showToast((err as Error).message || 'Gagal menandai selesai', 'error');
    } finally {
      setCompletingId(null);
    }
  }

  function openRejectModal(rowId: string) {
    setRejectingId(rowId);
    setRejectReason('');
  }

  async function confirmReject() {
    if (!rejectingId || !rejectReason.trim()) return;
    setRejectingInProgress(true);
    try {
      await api.admin.rejectSks(rejectingId, rejectReason.trim());
      showToast('Ditolak. Email pemberitahuan dikirim.');
      setRejectingId(null);
      setRejectReason('');
      load();
    } catch (err) {
      showToast((err as Error).message || 'Gagal menolak', 'error');
    } finally {
      setRejectingInProgress(false);
    }
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
            <h1 className="text-2xl font-bold text-[var(--foreground)] mt-0.5">Pembayaran SKS</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface-sunken)] rounded-lg p-1 mb-5 w-fit">
        {(['pending', 'all'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              tab === t
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {t === 'pending' ? 'Menunggu' : 'Semua'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Memuat...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">Belum ada permohonan</div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{r.name} <span className="text-[var(--text-muted)] font-mono text-xs">· {r.nim}</span></p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{r.email} · {r.semester_period} · {r.created_at_display}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${TONE_CLASSES[r.status_tone || 'neutral']}`}>
                  {r.status_label || '-'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Tagihan UT</p>
                  <p className="font-semibold text-[var(--foreground)] tabular-nums">{r.idr_amount_display}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Transfer Mahasiswa</p>
                  <p className="font-semibold text-indigo-700 tabular-nums">{r.ntd_amount_display}</p>
                </div>
              </div>
              {r.rejection_reason && (
                <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800">
                  <span className="font-semibold">Alasan: </span>{r.rejection_reason}
                </div>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => openSignedUrl(r.id, 'slip')}
                  disabled={loadingFile === `${r.id}:slip`}
                  className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-sunken)] disabled:opacity-50 transition-colors"
                >
                  {loadingFile === `${r.id}:slip` ? '...' : 'Lihat Slip UT'}
                </button>
                <button
                  onClick={() => openSignedUrl(r.id, 'proof')}
                  disabled={loadingFile === `${r.id}:proof`}
                  className="px-3 py-1.5 text-xs font-semibold border border-[var(--border-default)] rounded-lg hover:bg-[var(--surface-sunken)] disabled:opacity-50 transition-colors"
                >
                  {loadingFile === `${r.id}:proof` ? '...' : 'Lihat Bukti Transfer'}
                </button>
                {r.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleComplete(r.id)}
                      disabled={completingId === r.id}
                      className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50 transition-colors ml-auto"
                    >
                      {completingId === r.id ? '...' : 'Tandai Selesai'}
                    </button>
                    <button
                      onClick={() => openRejectModal(r.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Tolak
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !rejectingInProgress && setRejectingId(null)}
        >
          <div className="bg-[var(--surface)] rounded-2xl max-w-md w-full shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-[var(--foreground)] mb-2">Tolak Permohonan</h3>
            <p className="text-sm text-[var(--text-body)] mb-3">Berikan alasan agar mahasiswa tahu apa yang harus diperbaiki.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Alasan penolakan..."
              className="w-full border border-[var(--border-default)] rounded-xl px-3 py-2 text-sm bg-[var(--surface)] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[var(--ring-focus)]"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{rejectReason.length}/500</p>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setRejectingId(null)}
                disabled={rejectingInProgress}
                className="px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] rounded-lg disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmReject}
                disabled={rejectingInProgress || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {rejectingInProgress ? 'Menolak...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
