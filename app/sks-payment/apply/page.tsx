'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, type FeesConfig } from '@/lib/api';
import type { SksPaymentQuoteDTO } from '@/types';

export default function SksPaymentApplyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [fees, setFees] = useState<FeesConfig | null>(null);
  const [nim, setNim] = useState('');
  const [name, setName] = useState('');
  const [semesterPeriod, setSemesterPeriod] = useState('');
  const [idrAmount, setIdrAmount] = useState<number | ''>('');
  const [quote, setQuote] = useState<SksPaymentQuoteDTO | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slipInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const quoteTimeout = useRef<NodeJS.Timeout | null>(null);
  const quoteAbort = useRef<AbortController | null>(null);

  // Auth gate
  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login?redirect=/sks-payment/apply');
  }, [user, isLoading, router]);

  // Prefill NIM + name from profile
  useEffect(() => {
    if (!user) return;
    api.config.getFees().then(setFees).catch(() => {});
    api.auth.getMe().then((profile: { nim?: string | null; name?: string | null }) => {
      if (profile.nim) setNim(profile.nim);
      if (profile.name) setName(profile.name);
    }).catch(() => {});
  }, [user]);

  // Debounced quote: whenever idrAmount changes, ask the BE for the canonical NTD
  useEffect(() => {
    if (quoteTimeout.current) clearTimeout(quoteTimeout.current);
    quoteAbort.current?.abort();

    if (idrAmount === '' || !Number.isFinite(Number(idrAmount)) || Number(idrAmount) <= 0) {
      setQuote(null);
      setQuoteError(null);
      setQuoting(false);
      return;
    }

    setQuoting(true);
    setQuoteError(null);
    quoteTimeout.current = setTimeout(async () => {
      const controller = new AbortController();
      quoteAbort.current = controller;
      try {
        const q = await api.sksPayment.quote(Number(idrAmount), controller.signal);
        if (controller.signal.aborted) return;
        setQuote(q);
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') return;
        setQuote(null);
        setQuoteError((err as Error).message || 'Gagal menghitung kurs');
      } finally {
        if (!controller.signal.aborted) setQuoting(false);
      }
    }, 400);

    return () => { if (quoteTimeout.current) clearTimeout(quoteTimeout.current); };
  }, [idrAmount]);

  function handleSlipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSlipFile(f);
    setSlipUrl(null); // force re-upload of the new file
    setSlipPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  }

  function handleProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProofFile(f);
    setProofUrl(null);
    setProofPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!nim.trim() || !name.trim() || !semesterPeriod.trim()) {
      setError('NIM, nama, dan semester wajib diisi.');
      return;
    }
    if (idrAmount === '' || Number(idrAmount) <= 0) {
      setError('Nominal IDR wajib diisi.');
      return;
    }
    if (!slipFile && !slipUrl) {
      setError('Slip pembayaran UT wajib diunggah.');
      return;
    }
    if (!proofFile && !proofUrl) {
      setError('Bukti transfer wajib diunggah.');
      return;
    }

    setBusy(true);
    try {
      let resolvedSlipUrl = slipUrl;
      if (!resolvedSlipUrl && slipFile) {
        const { url } = await api.sksPayment.uploadSlip(slipFile);
        resolvedSlipUrl = url;
        setSlipUrl(url);
      }
      let resolvedProofUrl = proofUrl;
      if (!resolvedProofUrl && proofFile) {
        const { url } = await api.sksPayment.uploadProof(proofFile);
        resolvedProofUrl = url;
        setProofUrl(url);
      }
      await api.sksPayment.submit({
        nim: nim.trim(),
        name: name.trim(),
        semester_period: semesterPeriod.trim(),
        idr_amount: Number(idrAmount),
        ut_slip_url: resolvedSlipUrl!,
        transfer_proof_url: resolvedProofUrl!,
      });
      router.push('/sks-payment');
    } catch (err) {
      setError((err as Error).message || 'Terjadi kesalahan, coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="h-8 w-56 rounded skeleton mb-6" />
        <div className="h-64 rounded-2xl skeleton" />
      </div>
    );
  }

  const canSubmit = !busy
    && nim.trim() !== ''
    && name.trim() !== ''
    && semesterPeriod.trim() !== ''
    && idrAmount !== '' && Number(idrAmount) > 0
    && (slipFile != null || slipUrl != null)
    && (proofFile != null || proofUrl != null);

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/sks-payment" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] flex items-center gap-1 mb-3 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Pembayaran Registrasi Mata Kuliah</h1>
        <p className="text-sm text-[var(--text-body)] mt-1">
          Belum melakukan registrasi di eCampus UT? Lihat&nbsp;
          <Link href="/panduan#registrasi-matakuliah" className="text-indigo-600 hover:underline font-medium">
            panduan registrasi mata kuliah
          </Link>
          &nbsp;dulu, lalu kembali ke sini untuk membayar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: data + nominal */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 1: Data Pembayaran</h2>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1 block">NIM</label>
              <input
                type="text"
                value={nim}
                onChange={e => setNim(e.target.value)}
                maxLength={20}
                required
                className="w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm bg-[var(--surface)] focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]"
              />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1 block">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={120}
                required
                className="w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm bg-[var(--surface)] focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]"
              />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1 block">Semester / Periode</label>
              <input
                type="text"
                value={semesterPeriod}
                onChange={e => setSemesterPeriod(e.target.value)}
                maxLength={30}
                required
                placeholder="contoh: 2026.1 atau 2026 Ganjil"
                className="w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm bg-[var(--surface)] focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]"
              />
            </div>
            <div>
              <label className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1 block">
                Nominal Tagihan UT (Rp)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={idrAmount}
                onChange={e => setIdrAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
                placeholder="0"
                className="w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm bg-[var(--surface)] focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)] tabular-nums"
              />
              {fees?.sksPayment?.rate_label && (
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Kurs SALUT: {fees.sksPayment.rate_label}
                </p>
              )}
            </div>
          </div>

          {/* NTD preview from BE quote */}
          <div className="mt-4 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] rounded-xl p-4">
            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Estimasi Transfer Anda</p>
            <p className="text-2xl font-extrabold text-indigo-700 tabular-nums">
              {quoting ? '...' : quote?.ntd_amount_display ?? '...'}
            </p>
            {quoteError && <p className="text-xs text-red-600 mt-1">{quoteError}</p>}
            {!quoteError && quote?.rate_label && (
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{quote.rate_label}</p>
            )}
          </div>
        </div>

        {/* Step 2: upload UT slip */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 2: Upload Slip Pembayaran UT</h2>
          <div
            onClick={() => slipInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border-default)] hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors duration-150"
          >
            {slipPreview ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slipPreview} alt="Preview slip" className="max-h-48 object-contain rounded-lg" />
                <p className="text-xs text-[var(--text-muted)]">{slipFile?.name}</p>
              </div>
            ) : slipFile ? (
              <div className="flex flex-col items-center gap-2 text-[var(--text-body)]">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">{slipFile.name}</p>
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
            ref={slipInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleSlipChange}
          />
        </div>

        {/* Step 3: payment instructions */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 3: Transfer ke SALUT</h2>
          <div className="space-y-3 text-sm">
            {fees?.sksPayment?.payment_bank ? (
              <div>
                <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Rekening Tujuan (NTD)</p>
                <p className="text-[var(--foreground)] font-semibold">{fees.sksPayment.payment_bank.bank}</p>
                <p className="font-mono text-[var(--foreground)] text-sm mt-0.5">{fees.sksPayment.payment_bank.account}</p>
                <p className="text-[var(--text-body)] text-xs mt-0.5">a.n. {fees.sksPayment.payment_bank.holder}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                  Kode Bank: {fees.sksPayment.payment_bank.bank_code} · SWIFT: {fees.sksPayment.payment_bank.swift_code}
                </p>
              </div>
            ) : (
              <div className="h-10 rounded skeleton" />
            )}
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Nominal Transfer</p>
              <p className="text-xl font-extrabold text-indigo-700 tabular-nums">
                {quoting ? '...' : quote?.ntd_amount_display ?? '...'}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wide mb-1">Berita Transfer</p>
              <p className="font-mono bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--foreground)] text-xs">
                {quote?.memo_hint ?? '...'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: upload transfer proof */}
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-4 text-sm">Langkah 4: Upload Bukti Transfer</h2>
          <div
            onClick={() => proofInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border-default)] hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors duration-150"
          >
            {proofPreview ? (
              <div className="flex flex-col items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofPreview} alt="Preview bukti" className="max-h-48 object-contain rounded-lg" />
                <p className="text-xs text-[var(--text-muted)]">{proofFile?.name}</p>
              </div>
            ) : proofFile ? (
              <div className="flex flex-col items-center gap-2 text-[var(--text-body)]">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">{proofFile.name}</p>
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
            ref={proofInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleProofChange}
          />
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)] flex items-center justify-center gap-2"
        >
          {busy ? (
            <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Mengirim...</>
          ) : 'Kirim Permohonan'}
        </button>
      </form>
    </div>
  );
}
