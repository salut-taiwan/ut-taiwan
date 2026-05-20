'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type FeesConfig } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { NTD_BANKS, IDR_BANKS } from '@/lib/banks';
import { formatIDR } from '@/lib/utils';

const inputClass = "w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]";
const labelClass = "block text-sm font-medium text-[var(--foreground)] mb-1.5";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-semibold text-[var(--foreground)] border-l-[3px] border-l-indigo-500 pl-3 mb-4">
      {children}
    </h2>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [fees, setFees] = useState<FeesConfig | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/profile'); return; }
    api.config.getFees().then(setFees).catch(() => {});
    Promise.all([api.auth.getMe(), api.catalog.getPrograms()]).then(([p, progs]: any[]) => {
      setProfile(p);
      setPrograms(progs);
      setForm({
        name: p.name || '',
        nim: p.nim || '',
        phone: p.phone || '',
        program_id: p.program_id || '',
        current_semester: p.current_semester || '',
        birth_place: p.birth_place || '',
        birth_date: p.birth_date || '',
        address_zh_city: p.address_zh_city || '',
        address_zh_district: p.address_zh_district || '',
        address_zh_road: p.address_zh_road || '',
        address_zh_number: p.address_zh_number || '',
        address_zh_floor: p.address_zh_floor || '',
        postal_code: p.postal_code || '',
        bank_ntd_code: p.bank_ntd_code || '',
        bank_ntd_name: p.bank_ntd_name || '',
        bank_ntd_account: p.bank_ntd_account || '',
        bank_idr_name: p.bank_idr_name || '',
        bank_idr_account: p.bank_idr_account || '',
      });
    }).finally(() => setLoading(false));
  }, [authLoading, user, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleNtdBankChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    const bank = NTD_BANKS.find(b => b.code === code);
    setForm((f: any) => ({ ...f, bank_ntd_code: code, bank_ntd_name: bank ? bank.name : '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.auth.updateMe(form);
      setSaved(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="max-w-2xl space-y-4">
      <div className="h-8 w-36 rounded skeleton" />
      <div className="h-64 rounded-2xl skeleton" />
      <div className="h-48 rounded-2xl skeleton" />
      <div className="h-40 rounded-2xl skeleton" />
    </div>
  );

  const salutStatus = profile?.salut_status ?? 'none';
  const isSalut = profile?.is_salut_active ?? false;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Profil Saya</h1>

      {/* SALUT Membership card */}
      {(isSalut || ['pending', 'rejected', 'expired'].includes(salutStatus)) ? (
        <>
          {isSalut && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-teal-800">Anggota SALUT Aktif</p>
                <p className="text-sm text-teal-700 mt-0.5">Semua biaya layanan ({fees ? formatIDR(fees.totalServiceFees) : '...'}) dibebaskan untuk Anda.</p>
                {profile?.salut_approved_at && (
                  <p className="text-xs text-teal-600 mt-1">
                    Aktif sejak {new Date(profile.salut_approved_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )}
          {!isSalut && salutStatus === 'expired' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800">Keanggotaan SALUT Telah Berakhir</p>
                <p className="text-sm text-amber-700 mt-0.5">Perpanjang sekarang agar biaya layanan tetap dibebaskan.</p>
                <Link href="/salut/apply" className="text-xs font-semibold text-amber-800 hover:underline mt-2 inline-block">
                  Perpanjang SALUT →
                </Link>
              </div>
            </div>
          )}
          {salutStatus === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800">Permohonan SALUT Sedang Diverifikasi</p>
                {profile?.salut_applied_at && (
                  <p className="text-sm text-amber-700 mt-0.5">
                    Dikirim {new Date(profile.salut_applied_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p className="text-xs text-amber-600 mt-1">Admin akan memverifikasi dalam 1–2 hari kerja.</p>
              </div>
            </div>
          )}
          {salutStatus === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800">Permohonan SALUT Ditolak</p>
                {profile?.salut_rejection_reason && (
                  <p className="text-sm text-red-700 mt-0.5">{profile.salut_rejection_reason}</p>
                )}
                <Link href="/salut/apply" className="text-xs font-semibold text-red-700 hover:underline mt-2 inline-block">
                  Ajukan Ulang →
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-indigo-800">Belum Anggota SALUT</p>
            <p className="text-sm text-indigo-700 mt-0.5">Hemat {fees ? formatIDR(fees.totalServiceFees) : '...'} biaya layanan per semester dengan bergabung SALUT.</p>
            <Link href="/salut/apply" className="text-xs font-semibold text-indigo-700 hover:underline mt-2 inline-block">
              Daftar SALUT →
            </Link>
          </div>
        </div>
      )}

      {saved && (
        <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl px-4 py-3 animate-[slideDown_200ms_ease-out]">
          <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Profil berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-6 mb-4">
          <SectionHeading>Informasi Pribadi</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama Lengkap *</label>
              <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input value={profile?.email} disabled
                className="w-full border border-[var(--border)] bg-[var(--surface-sunken)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--text-muted)] cursor-not-allowed" />
            </div>
            <div>
              <label className={labelClass}>NIM</label>
              <input name="nim" value={form.nim} onChange={handleChange}
                className={inputClass} placeholder="Nomor Induk Mahasiswa" />
            </div>
            <div>
              <label className={labelClass}>Nomor WhatsApp Aktif</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                className={inputClass} placeholder="+886 xxx xxx xxx" />
              <p className="text-xs text-[var(--text-muted)] mt-1">Gunakan nomor yang aktif di WhatsApp</p>
            </div>
            <div>
              <label className={labelClass}>Tempat Lahir</label>
              <input name="birth_place" value={form.birth_place} onChange={handleChange}
                className={inputClass} placeholder="Kota/kabupaten tempat lahir" />
            </div>
            <div>
              <label className={labelClass}>Tanggal Lahir</label>
              <input name="birth_date" type="date" value={form.birth_date} onChange={handleChange}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Program Studi</label>
              <select name="program_id" value={form.program_id} onChange={handleChange} className={inputClass}>
                <option value="">Pilih Program Studi</option>
                {programs.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Semester Sekarang</label>
              <select name="current_semester" value={form.current_semester} onChange={handleChange} className={inputClass}>
                <option value="">Pilih Semester</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-6 mb-4">
          <SectionHeading>Alamat Pengiriman Default</SectionHeading>
          <p className="text-xs text-[var(--text-muted)] mb-4">Harap isi dalam bahasa Mandarin (請用中文填寫)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>縣市 *</label>
              <input name="address_zh_city" value={form.address_zh_city} onChange={handleChange}
                className={inputClass} placeholder="台北市" />
            </div>
            <div>
              <label className={labelClass}>區 *</label>
              <input name="address_zh_district" value={form.address_zh_district} onChange={handleChange}
                className={inputClass} placeholder="信義區" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>路/街 *</label>
              <input name="address_zh_road" value={form.address_zh_road} onChange={handleChange}
                className={inputClass} placeholder="信義路五段" />
            </div>
            <div>
              <label className={labelClass}>號 *</label>
              <input name="address_zh_number" value={form.address_zh_number} onChange={handleChange}
                className={inputClass} placeholder="7號" />
            </div>
            <div>
              <label className={labelClass}>樓/室 (選填)</label>
              <input name="address_zh_floor" value={form.address_zh_floor} onChange={handleChange}
                className={inputClass} placeholder="3樓" />
            </div>
            <div>
              <label className={labelClass}>郵遞區號 *</label>
              <input name="postal_code" value={form.postal_code} onChange={handleChange} required
                className={inputClass} placeholder="106" />
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-6 mb-6">
          <SectionHeading>Rekening Bank</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* NTD Bank */}
            <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4">
              <p className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wide mb-3">Rekening NTD (Taiwan)</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Bank</label>
                  <select value={form.bank_ntd_code} onChange={handleNtdBankChange}
                    className={inputClass}>
                    <option value="">Pilih Bank NTD</option>
                    {NTD_BANKS.map((b: any) => (
                      <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nomor Rekening</label>
                  <input name="bank_ntd_account" value={form.bank_ntd_account} onChange={handleChange}
                    className={inputClass} placeholder="Nomor rekening NTD" />
                </div>
              </div>
            </div>

            {/* IDR Bank */}
            <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4">
              <p className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wide mb-3">Rekening IDR (Indonesia)</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Bank</label>
                  <select name="bank_idr_name" value={form.bank_idr_name} onChange={handleChange}
                    className={inputClass}>
                    <option value="">Pilih Bank IDR</option>
                    {IDR_BANKS.map((b: any) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Nomor Rekening</label>
                  <input name="bank_idr_account" value={form.bank_idr_account} onChange={handleChange}
                    className={inputClass} placeholder="Nomor rekening IDR" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
        >
          {saving ? <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Menyimpan...</> : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}
