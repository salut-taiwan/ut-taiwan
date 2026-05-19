'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';

const MEMBERSHIP_FEE = 650_000;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function SalutApplyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'none' | 'pending' | 'approved' | 'rejected'>('loading');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [appliedAt, setAppliedAt] = useState<string | null>(null);

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
    api.salut.getStatus().then(s => {
      setStatus((s.is_salut || s.salut_status === 'approved') ? 'approved' : (s.salut_status as any) || 'none');
      setRejectionReason(s.salut_rejection_reason);
      setAppliedAt(s.salut_applied_at);
    }).catch(() => setStatus('none'));
  }, [user, isLoading, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError('Format tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.');
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFileError('Ukuran file maksimal 5 MB.');
      return;
    }
    setFile(f);
    if (f.type !== 'application/pdf') {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.salut.uploadProof(file);
      await api.salut.apply(url);
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
        {appliedAt && (
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Dikirim: {new Date(appliedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
        <p className="text-sm text-[var(--text-body)] mt-1">Hemat {formatIDR(425_000)} biaya layanan per semester.</p>
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
        <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 1 — Lakukan Pembayaran</h2>
        <div className="flex gap-5 items-start">
          <div className="flex-1 space-y-3 text-sm">
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Jumlah Transfer</p>
              <p className="text-xl font-extrabold text-indigo-700 tabular-nums">{formatIDR(MEMBERSHIP_FEE)}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Berita Transfer</p>
              <p className="font-mono bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--foreground)] text-xs">SALUT {user?.name?.split(' ')[0] || '[Nama]'}</p>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="w-28 h-28 bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/qris.png"
                alt="QRIS"
                width={108}
                height={108}
                className="object-contain"
                unoptimized
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">Scan QRIS</p>
          </div>
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 2 — Upload Bukti Pembayaran</h2>

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
              <p className="text-xs">JPG, PNG, WebP, atau PDF — maks. 5 MB</p>
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
          disabled={!file || uploading}
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
