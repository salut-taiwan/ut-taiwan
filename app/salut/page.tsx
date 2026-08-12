'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api, type FeesConfig } from '@/lib/api';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

type BenefitIcon = 'cap' | 'truck' | 'globe' | 'gift' | 'ribbon' | 'monitor' | 'headphones';

function BenefitIconSvg({ name }: { name: BenefitIcon }) {
  const common = { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.75 } as const;
  switch (name) {
    case 'cap':
      return (
        <svg {...common} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      );
    case 'truck':
      return (
        <svg {...common} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-6m6 0h2.25m-8.25-4.5H2.25" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      );
    case 'gift':
      return (
        <svg {...common} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      );
    case 'ribbon':
      return (
        <svg {...common} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 1 1 9 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 18.75 1.5 4.5h4.5l1.5-4.5m-7.5 0 2.625-3 2.625 3M12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        </svg>
      );
    case 'monitor':
      return (
        <svg {...common} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
        </svg>
      );
    case 'headphones':
      return (
        <svg {...common} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      );
  }
}

const BENEFITS: { icon: BenefitIcon; title: string; nonSalut: string; salut: string }[] = [
  { icon: 'cap',         title: 'Almamater',                            nonSalut: 'Tidak termasuk',                      salut: 'Termasuk' },
  { icon: 'truck',       title: 'Ongkir Almamater',                     nonSalut: 'Biaya ditanggung mahasiswa',          salut: 'Gratis' },
  { icon: 'globe',       title: 'Ongkir Pengiriman Internasional',      nonSalut: 'Biaya ditanggung mahasiswa',          salut: 'Gratis' },
  { icon: 'cap',         title: 'Biaya Wisuda Offline',                 nonSalut: 'Ada biaya tambahan sesuai ketentuan', salut: 'Gratis biaya wisuda offline' },
  { icon: 'gift',        title: 'Special Merchandise Wisuda',           nonSalut: 'Tidak termasuk',                      salut: 'Termasuk' },
  { icon: 'ribbon',      title: 'Kesempatan Beasiswa SALUT',            nonSalut: 'Tidak tersedia',                      salut: 'Berkesempatan mendapatkan beasiswa SALUT' },
  { icon: 'monitor',     title: 'Akses Sarana Fasilitas Ujian Online',  nonSalut: 'Ada biaya tambahan sesuai ketentuan', salut: 'Akses fasilitas tersedia untuk anggota' },
  { icon: 'headphones',  title: 'Dukungan Selama Masa Perkuliahan',     nonSalut: 'Terbatas',                            salut: 'Pendampingan selama masa perkuliahan untuk berbagai kendala khusus' },
];

export default function SalutPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeesConfig | null>(null);

  useEffect(() => {
    api.config.getFees().then(setFees).catch(() => {});
  }, []);

  const tierLabel = fees?.salutMembership?.tier_combined_display ?? '...';
  const isMember = Boolean(user?.is_member ?? user?.is_salut_active);
  const isPending = Boolean(user?.is_pending) || (!isMember && user?.salut_status === 'pending');

  const steps: { n: string; title: string; desc: string }[] = [
    {
      n: '1',
      title: 'Transfer Biaya Keanggotaan',
      desc: `Transfer ${tierLabel} melalui QRIS SALUT di halaman pendaftaran (login dulu).`,
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

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border border-teal-200 mb-4">
          SALUT Membership
        </span>
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] mb-3">
          Bergabung SALUT: Satu Keanggotaan, Banyak Kemudahan
        </h1>
        <p className="text-[var(--text-body)] text-base max-w-xl mx-auto">
          Anggota SALUT mendapatkan berbagai benefit seperti almamater dengan ongkir gratis, layanan pengiriman internasional, fasilitas ujian online, kesempatan beasiswa, serta benefit tambahan untuk wisuda offline.
        </p>
      </div>

      {/* Perbandingan Benefit Anggota */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-6 mb-6">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Perbandingan Benefit Anggota</h2>
        <div className="divide-y divide-[var(--border-subtle)]">
          {/* Header */}
          <div className="grid grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] gap-3 sm:gap-4 pb-3 text-sm">
            <div />
            <div className="font-medium text-[var(--text-muted)]">Benefit</div>
            <div className="font-medium text-[var(--text-muted)]">Non-SALUT</div>
            <div className="font-semibold text-teal-700">SALUT</div>
          </div>
          {/* Rows */}
          {BENEFITS.map(b => (
            <BenefitRow key={b.title} icon={b.icon} title={b.title} nonSalut={b.nonSalut} salut={b.salut} />
          ))}
        </div>
      </div>

      {/* Biaya Keanggotaan SALUT */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-6 mb-6">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Biaya Keanggotaan SALUT</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium text-[var(--text-muted)]">Periode</div>
          <div className="font-medium text-[var(--text-muted)]">Biaya</div>
          <div className="border-t border-[var(--border-subtle)] pt-2.5 text-[var(--foreground)]">Semester Pertama</div>
          <div className="border-t border-[var(--border-subtle)] pt-2.5 font-semibold text-teal-700 tabular-nums">
            {fees?.salutMembership ? (
              <>
                {fees.salutMembership.new_display}
                {fees.salutMembership.new_display_idr && (
                  <span className="block text-xs font-medium text-[var(--text-muted)]">{fees.salutMembership.new_display_idr}</span>
                )}
              </>
            ) : <span className="inline-block w-20 h-4 rounded skeleton" />}
          </div>
          <div className="border-t border-[var(--border-subtle)] pt-2.5 text-[var(--foreground)]">Semester Berikutnya</div>
          <div className="border-t border-[var(--border-subtle)] pt-2.5 font-semibold text-teal-700 tabular-nums">
            {fees?.salutMembership ? (
              <>
                {fees.salutMembership.returning_display}
                {fees.salutMembership.returning_display_idr && (
                  <span className="block text-xs font-medium text-[var(--text-muted)]">{fees.salutMembership.returning_display_idr}</span>
                )}
              </>
            ) : <span className="inline-block w-20 h-4 rounded skeleton" />}
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-4">
          Biaya keanggotaan dibayarkan per semester dan digunakan untuk mendukung layanan, fasilitas, serta benefit anggota SALUT.
        </p>
        {fees?.salutMembership?.renewalPolicy?.notice && (
          <p className="text-xs italic text-[var(--text-muted)] mt-2">
            <strong>Keanggotaan SALUT berakhir</strong> setiap <strong>1 Mei</strong> dan <strong>1 November</strong> pukul 00:00 (Asia/Taipei). Perpanjangan wajib dilakukan setiap semester.
          </p>
        )}
      </div>

      {/* Cara Daftar */}
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

      {/* Detail Pembayaran — QRIS hanya di halaman pendaftaran (lihat catatan di bawah) */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-6 mb-8">
        <h2 className="font-semibold text-[var(--foreground)] mb-4">Detail Pembayaran</h2>
        <div className="space-y-3 text-sm">
          <p className="text-[var(--text-body)]">
            QRIS pembayaran ditampilkan di halaman pendaftaran setelah Anda login. Pembayaran hanya
            dilakukan melalui QRIS tersebut agar admin dapat mencocokkan transfer Anda dengan permohonan.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
            Jangan transfer sebelum mengisi permohonan — pembayaran tanpa permohonan tidak dapat dilacak
            dan tidak otomatis menjadikan Anda anggota.
          </div>
          <Link
            href={user ? '/salut/apply' : '/login?redirect=/salut/apply'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Buka halaman pendaftaran
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        {isMember ? (
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 px-6 py-3 rounded-xl font-semibold">
            <CheckIcon className="w-5 h-5" />
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

function BenefitRow({ icon, title, nonSalut, salut }: { icon: BenefitIcon; title: string; nonSalut: string; salut: string }) {
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] gap-3 sm:gap-4 py-3.5 items-center text-sm">
      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 -ml-0.5">
        <BenefitIconSvg name={icon} />
      </div>
      <div className="font-semibold text-[var(--foreground)] leading-snug">{title}</div>
      <div className="text-[var(--text-body)] leading-snug">{nonSalut}</div>
      <div className="font-medium text-teal-700 leading-snug">{salut}</div>
    </div>
  );
}
