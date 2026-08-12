'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, type FeesConfig } from '@/lib/api';
import Input from '@/components/ui/Input';

export default function SalutApplyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [fees, setFees] = useState<FeesConfig | null>(null);
  const [status, setStatus] = useState<'loading' | 'none' | 'pending' | 'approved' | 'rejected' | 'expired'>('loading');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [appliedAtDisplay, setAppliedAtDisplay] = useState<string | null>(null);
  const [currentSemester, setCurrentSemester] = useState<number | ''>('');
  const [waNumber, setWaNumber] = useState('');

  const [qrisOpen, setQrisOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?redirect=/salut/apply');
      return;
    }
    api.config.getFees().then(setFees).catch(() => {});
    api.salut.getStatus().then(s => {
      // Use backend-derived effective_status (replaces client eligibility logic)
      setStatus((s.effective_status as 'none' | 'pending' | 'approved' | 'rejected' | 'expired') || 'none');
      setRejectionReason(s.salut_rejection_reason);
      setAppliedAtDisplay(s.salut_applied_at_display ?? null);
      if (typeof s.salut_applied_semester === 'number') setCurrentSemester(s.salut_applied_semester);
    }).catch(() => setStatus('none'));
    api.auth.getMe().then((profile: { current_semester?: number | null; phone?: string | null }) => {
      if (typeof profile.current_semester === 'number') setCurrentSemester(profile.current_semester);
      if (profile.phone) setWaNumber(profile.phone);
    }).catch(() => {});
  }, [user, isLoading, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    // No client-side MIME/size validation - backend rejects with structured error.
    setFileError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !waNumber.trim()) return;
    setUploading(true);
    try {
      const { url } = await api.salut.uploadProof(file);
      await api.salut.apply(url, currentSemester === '' ? 0 : Number(currentSemester), waNumber.trim());
      setSubmitted(true);
      setStatus('pending');
    } catch (err) {
      setFileError((err as Error).message || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setUploading(false);
    }
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="h-8 w-56 rounded skeleton mb-6" />
        <div className="h-64 rounded-2xl skeleton" />
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Anda Sudah Anggota SALUT</h1>
        <p className="text-[var(--text-body)] mb-6">Semua biaya layanan sudah dibebaskan untuk Anda.</p>
        <Link href="/profile" className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors duration-150">
          Lihat Profil
        </Link>
      </div>
    );
  }

  if (status === 'pending' && !submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Permohonan Sedang Diproses</h1>
        {appliedAtDisplay && (
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Dikirim: {appliedAtDisplay}
          </p>
        )}
        <p className="text-[var(--text-body)] mb-6">Admin akan memverifikasi dalam 1–2 hari kerja.</p>
        <Link href="/profile" className="text-sm text-indigo-600 hover:underline">Kembali ke Profil</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Permohonan Terkirim!</h1>
        <p className="text-[var(--text-body)] mb-6">Admin akan memverifikasi pembayaran dalam 1–2 hari kerja. Anda akan mendapat notifikasi melalui email.</p>
        <Link href="/profile" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors duration-150">
          Kembali ke Profil
        </Link>
      </div>
    );
  }

  // IDR leads: the transfer happens over QRIS in rupiah, and the NTD figure is
  // what the fee is quoted in.
  const feeDisplay = currentSemester === '' || !fees
    ? null
    : currentSemester === 1
      ? { amount: fees.salutMembership.new_display_idr, ntd: fees.salutMembership.new_display, label: fees.salutMembership.new_label }
      : { amount: fees.salutMembership.returning_display_idr, ntd: fees.salutMembership.returning_display, label: fees.salutMembership.returning_label };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/salut" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Daftar Keanggotaan SALUT</h1>
        <p className="text-sm text-[var(--text-body)] mt-1">Hemat {fees?.totalServiceFees_display ?? '...'} biaya layanan per semester.</p>
      </div>

      {/* Rejection notice */}
      {status === 'rejected' && rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-800">
          <p className="font-semibold mb-1">Permohonan sebelumnya ditolak</p>
          <p>{rejectionReason}</p>
          <p className="mt-2 text-xs text-red-600">Anda dapat mengajukan permohonan baru di bawah.</p>
        </div>
      )}

      {/* Payment reminder */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5 mb-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 1: Lakukan Pembayaran</h2>
        <div className="space-y-3 text-sm mb-5">
          <div>
            <label className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1 block" htmlFor="semester-select">Semester Saat Ini</label>
            <select
              id="semester-select"
              value={currentSemester}
              onChange={e => setCurrentSemester(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm bg-[var(--surface)] focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]"
            >
              <option value="">Pilih semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <option key={n} value={n}>Semester {n}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Jumlah Transfer</p>
            <p className="text-xl font-extrabold text-indigo-700 tabular-nums">
              {feeDisplay?.amount ?? '...'}
            </p>
            {feeDisplay?.label && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {feeDisplay.ntd} — {feeDisplay.label}
              </p>
            )}
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Berita Transfer</p>
            <p className="font-mono bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--foreground)] text-xs">SALUT {user?.name?.split(' ')[0] || '[Nama]'}</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setQrisOpen(true)}
            className="w-64 h-64 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-2xl flex items-center justify-center overflow-hidden p-4 hover:border-indigo-400 transition-colors duration-150 cursor-zoom-in"
          >
            <Image
              src="/qris.png"
              alt="QRIS"
              width={240}
              height={240}
              className="object-contain"
              unoptimized
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </button>
          <p className="text-xs text-[var(--text-muted)]">Klik gambar untuk memperbesar</p>
        </div>

        {fees?.salutMembership.renewalPolicy.notice && (
          <p className="text-xs italic text-[var(--text-muted)] mt-4 text-center">
            <strong>Keanggotaan SALUT berakhir</strong> setiap <strong>1 Mei</strong> dan <strong>1 November</strong> pukul 00:00 (Asia/Taipei). Perpanjangan wajib dilakukan setiap semester.
          </p>
        )}

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
                alt="QRIS"
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

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 2: Data & Bukti Pembayaran</h2>

        <div className="mb-4">
          <Input
            label="Nomor WhatsApp Aktif *"
            id="wa-number"
            name="wa_number"
            type="tel"
            required
            value={waNumber}
            onChange={e => setWaNumber(e.target.value)}
            placeholder="08123456789"
            hint="Admin menambahkan Anda ke grup SALUT lewat nomor ini."
          />
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border-default)] hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors duration-150 mb-3"
        >
          {preview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={preview} alt="Preview" className="max-h-48 object-contain rounded-lg" />
              <p className="text-xs text-[var(--text-muted)]">{file?.name}</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-2 text-[var(--text-body)]">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-[var(--text-muted)]">Klik untuk ganti file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm font-medium">Klik untuk pilih file</p>
              <p className="text-xs">JPG, PNG, WebP, atau PDF (maks. 5 MB)</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {fileError && <p className="text-xs text-red-600 mb-3">{fileError}</p>}

        <button
          type="submit"
          disabled={!file || !waNumber.trim() || uploading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)] flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Mengirim...</>
          ) : 'Kirim Permohonan'}
        </button>
      </form>
    </div>
  );
}
