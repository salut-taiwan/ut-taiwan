'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { SksPaymentDTO, SksPaymentTone } from '@/types';

const TONE_CLASSES: Record<SksPaymentTone, string> = {
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-[var(--surface-sunken)] text-[var(--text-muted)] border-[var(--border)]',
};

function StatusBadge({ tone, label }: { tone?: SksPaymentTone; label?: string }) {
  const cls = TONE_CLASSES[tone || 'neutral'];
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {label || '—'}
    </span>
  );
}

export default function SksPaymentListPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<SksPaymentDTO[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?redirect=/sks-payment');
      return;
    }
    api.sksPayment.listMine()
      .then(setRows)
      .catch(() => setLoadError(true));
  }, [user, isLoading, router]);

  if (isLoading || rows === null) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 w-56 rounded skeleton mb-6" />
        <div className="h-40 rounded-2xl skeleton" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-[var(--text-muted)] mb-4">Gagal memuat data. Coba lagi.</p>
        <button onClick={() => location.reload()} className="text-sm font-semibold text-indigo-600 hover:underline">
          Muat ulang
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">SALUT</span>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mt-0.5">Bantuan Bayar SKS</h1>
          <p className="text-sm text-[var(--text-body)] mt-1">
            Bayar registrasi mata kuliah dalam NTD, SALUT bayarkan ke UT dalam Rupiah.
          </p>
        </div>
        <Link
          href="/sks-payment/apply"
          className="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-[var(--shadow-sm)]"
        >
          Ajukan Baru
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-8 text-center">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="font-semibold text-[var(--foreground)] mb-2">Belum ada pembayaran</h2>
          <p className="text-sm text-[var(--text-body)] mb-4 max-w-md mx-auto">
            Belum melakukan registrasi mata kuliah? Lihat caranya di&nbsp;
            <Link href="/panduan#registrasi-matakuliah" className="text-indigo-600 hover:underline font-medium">
              Panduan Registrasi Mata Kuliah
            </Link>
            , lalu kembali ke sini untuk membayar dalam NTD.
          </p>
          <Link
            href="/sks-payment/apply"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Mulai Pembayaran SKS
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <div
              key={r.id}
              className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{r.semester_period}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{r.created_at_display}</p>
                </div>
                <StatusBadge tone={r.status_tone} label={r.status_label} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Nominal Tagihan</p>
                  <p className="font-semibold text-[var(--foreground)] tabular-nums">{r.idr_amount_display}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Transfer Anda</p>
                  <p className="font-semibold text-indigo-700 tabular-nums">{r.ntd_amount_display}</p>
                </div>
              </div>
              {r.status === 'rejected' && r.rejection_reason && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800">
                  <span className="font-semibold">Alasan: </span>{r.rejection_reason}
                </div>
              )}
              {r.status === 'completed' && r.completed_at_display && (
                <p className="mt-3 text-xs text-emerald-700">
                  Diselesaikan pada {r.completed_at_display}.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
