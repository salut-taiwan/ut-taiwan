'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api, type FeesConfig } from '@/lib/api';

export default function SalutPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeesConfig | null>(null);

  useEffect(() => {
    api.config.getFees().then(setFees).catch(() => {});
  }, []);

  const tierLabel = fees?.salutMembership.tier_combined_display ?? '...';

  const steps = [
    {
      n: '1',
      title: 'Transfer Biaya Keanggotaan',
      desc: `Transfer ${tierLabel} ke rekening atau QRIS SALUT di bawah.`,
    },
    {
      n: '2',
      title: 'Upload Bukti Pembayaran',
      desc: 'Upload screenshot atau foto bukti transfer melalui halaman pendaftaran.',
    },
    {
      n: '3',
      title: 'Tunggu Konfirmasi Admin',
      desc: 'Admin akan memverifikasi pembayaran dalam 1–2 hari kerja.',
    },
  ];

  const [qrisOpen, setQrisOpen] = useState(false);
  const isMember = Boolean(user?.is_member ?? user?.is_salut_active);
  const isPending = Boolean(user?.is_pending) || (!isMember && user?.salut_status === 'pending');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border border-teal-200 mb-4">
          SALUT Membership
        </span>
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] mb-3">
          Bergabung SALUT: Hemat {fees?.totalServiceFees_display ?? '...'} Per Semester
        </h1>
        <p className="text-[var(--text-body)] text-base max-w-xl mx-auto">
          Anggota SALUT tidak dikenakan biaya layanan pengiriman internasional. Daftar sekali, nikmati manfaatnya setiap semester.
        </p>
      </div>

      {/* Benefits */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-6 mb-6">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Perbandingan Biaya Per Pesanan</h2>
        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div className="font-medium text-[var(--text-muted)]">Komponen</div>
          <div className="font-medium text-[var(--text-muted)] text-center">Non-SALUT</div>
          <div className="font-semibold text-teal-700 text-center">SALUT</div>
        </div>
        {(fees?.serviceFees ?? [{ label: 'Ongkos Kirim', key: 'shipping', amount: 0, amount_display: undefined }, { label: 'Biaya Box', key: 'box', amount: 0, amount_display: undefined }, { label: 'Biaya Admin', key: 'admin', amount: 0, amount_display: undefined }]).map(({ label, amount_display }) => (
          <div key={label} className="grid grid-cols-3 gap-2 text-sm py-2.5 border-t border-[var(--border-subtle)]">
            <div className="text-[var(--foreground)]">{label}</div>
            <div className="text-center tabular-nums text-[var(--text-body)]">{amount_display ?? <span className="inline-block w-16 h-4 rounded skeleton" />}</div>
            <div className="text-center font-semibold text-teal-600">Gratis</div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2 text-sm py-2.5 border-t-2 border-[var(--border)] mt-1">
          <div className="font-bold text-[var(--foreground)]">Total Biaya</div>
          <div className="text-center tabular-nums font-bold text-[var(--foreground)] line-through opacity-60">{fees?.totalServiceFees_display ?? '...'}</div>
          <div className="text-center font-extrabold text-teal-700">Rp 0</div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-6 mb-6">
        <h2 className="font-semibold text-[var(--foreground)] mb-5">Cara Daftar</h2>
        <div className="space-y-4">
          {steps.map(step => (
            <div key={step.n} className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {step.n}
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)] text-sm">{step.title}</p>
                <p className="text-sm text-[var(--text-body)] mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panduan cross-link */}
      <div className="mb-6 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-800">
        <svg className="w-4 h-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <span>Mahasiswa baru UT? <a href="/panduan#mahasiswa-baru" className="font-semibold underline hover:text-indigo-600">Lihat panduan pendaftaran &rarr;</a></span>
      </div>

      {/* Payment details */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-6 mb-8">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Detail Pembayaran</h2>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-1 space-y-3 text-sm">
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Jumlah Transfer</p>
              {fees ? (
                <>
                  <p className="text-2xl font-extrabold text-indigo-700 tabular-nums">{fees.salutMembership.new_display}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Mahasiswa baru (semester 1)</p>
                  <p className="text-2xl font-extrabold text-indigo-700 tabular-nums mt-2">{fees.salutMembership.returning_display}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Mahasiswa lama (semester 2+)</p>
                  {fees.salutMembership.renewalPolicy.notice && (
                    <p className="text-xs italic text-[var(--text-muted)] mt-3">{fees.salutMembership.renewalPolicy.notice}</p>
                  )}
                </>
              ) : <p className="text-2xl font-extrabold text-indigo-700 tabular-nums">...</p>}
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Berita / Catatan Transfer</p>
              <p className="font-mono bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--foreground)] text-xs">SALUT [NIM Anda]</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
              Simpan bukti pembayaran Anda, lalu upload melalui halaman pendaftaran.
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setQrisOpen(true)}
              className="w-40 h-40 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl flex items-center justify-center overflow-hidden p-2 hover:border-indigo-400 transition-colors duration-150 cursor-zoom-in"
            >
              <Image
                src="/qris.png"
                alt="QRIS SALUT"
                width={152}
                height={152}
                className="object-contain"
                unoptimized
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </button>
            <p className="text-xs text-[var(--text-muted)]">Klik untuk memperbesar</p>
          </div>

          {qrisOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
              onClick={() => setQrisOpen(false)}
            >
              <div className="relative bg-white rounded-2xl p-4 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setQrisOpen(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <Image
                  src="/qris.png"
                  alt="QRIS SALUT"
                  width={400}
                  height={400}
                  className="w-full h-auto"
                  unoptimized
                />
                <p className="text-center text-xs text-gray-400 mt-2">Scan QRIS untuk membayar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        {isMember ? (
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-6 py-3 rounded-xl font-semibold">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Anda sudah menjadi Anggota SALUT
          </div>
        ) : isPending ? (
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-6 py-3 rounded-xl font-semibold">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07-2.83 2.83M8.76 15.24l-2.83 2.83m0-15.14 2.83 2.83m6.48 6.48 2.83 2.83" />
            </svg>
            Permohonan Sedang Diproses
          </div>
        ) : (
          <Link
            href={user ? '/salut/apply' : '/login?redirect=/salut/apply'}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 hover:-translate-y-px transition-[background-color,transform,box-shadow] duration-150 font-semibold shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
          >
            Daftar Sekarang
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
