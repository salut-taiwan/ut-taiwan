'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, type BankOption } from '@/lib/api';
import type { ProgramDTO } from '@/types';

const inputClass = "w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]";
const selectClass = inputClass;
const labelClass = "block text-sm font-medium text-[var(--foreground)] mb-1.5";

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5">
      <p className="text-sm font-semibold text-[var(--foreground)] mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', name: '', nim: '', phone: '',
    birth_place: '', birth_date: '',
    program_id: '', current_semester: '',
    address_zh_city: '', address_zh_district: '', address_zh_road: '',
    address_zh_number: '', address_zh_floor: '', postal_code: '',
    bank_ntd_code: '', bank_ntd_name: '', bank_ntd_account: '',
    bank_idr_name: '', bank_idr_account: '',
  });
  const [programs, setPrograms] = useState<ProgramDTO[]>([]);
  const [ntdBanks, setNtdBanks] = useState<BankOption[]>([]);
  const [idrBanks, setIdrBanks] = useState<BankOption[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.catalog.getPrograms().then(data => setPrograms(data)).catch(() => {});
    api.config.getBanks('NTD').then(r => setNtdBanks(r.banks)).catch(() => {});
    api.config.getBanks('IDR').then(r => setIdrBanks(r.banks)).catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // All validation is server-side now. Backend rejects with structured error.
    setLoading(true);
    try {
      await api.auth.register({
        email: form.email,
        password: form.password,
        name: form.name,
        nim: form.nim,
        phone: form.phone,
        birth_place: form.birth_place,
        birth_date: form.birth_date,
        program_id: form.program_id,
        current_semester: Number(form.current_semester),
        address_zh_city: form.address_zh_city,
        address_zh_district: form.address_zh_district,
        address_zh_road: form.address_zh_road,
        address_zh_number: form.address_zh_number,
        address_zh_floor: form.address_zh_floor || undefined,
        postal_code: form.postal_code,
        bank_ntd_code: form.bank_ntd_code || undefined,
        bank_ntd_account: form.bank_ntd_account || undefined,
        bank_idr_name: form.bank_idr_name || undefined,
        bank_idr_account: form.bank_idr_account || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[var(--background)]">
        <div className="max-w-md text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-sm)]">
            <svg className="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Cek Email Anda</h2>
          <p className="text-[var(--text-body)] mb-6">
            Link verifikasi telah dikirim ke <strong>{form.email}</strong>. Silakan klik link tersebut untuk mengaktifkan akun Anda.
          </p>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">Kembali ke Halaman Masuk</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-[var(--primary)] flex-col items-center justify-center p-12 text-white">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-800/30 rounded-full pointer-events-none" />
        <div className="relative max-w-sm text-center">
          <span className="text-4xl font-bold block mb-2 tracking-tight">UT Taiwan</span>
          <span className="text-indigo-200/80 text-sm block mb-8">Sentra Layanan UT Taiwan</span>
          <p className="text-indigo-100/90 text-lg leading-relaxed">
            Daftar sekarang dan mulai belanja modul kuliah Universitas Terbuka dari Taiwan dengan mudah.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-start justify-center p-6 lg:p-12 overflow-y-auto bg-[var(--background)]">
        <div className="w-full max-w-md py-8">
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border-subtle)] shadow-[var(--shadow-xl)] p-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Daftar Akun</h1>
            <p className="text-sm text-[var(--text-body)] mb-6">
              Sudah punya akun? <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Masuk</Link>
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Nama Lengkap *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className={inputClass} placeholder="Nama lengkap sesuai KTP" />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className={inputClass} placeholder="email@example.com" />
              </div>
              <div>
                <label className={labelClass}>NIM *</label>
                <input name="nim" value={form.nim} onChange={handleChange} required
                  className={inputClass} placeholder="Nomor Induk Mahasiswa UT" />
              </div>
              <div>
                <label className={labelClass}>Nomor WhatsApp Aktif *</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                  className={inputClass} placeholder="+886 xxx xxx xxx" />
                <p className="text-xs text-[var(--text-muted)] mt-1">Gunakan nomor yang aktif di WhatsApp</p>
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required
                  className={inputClass} placeholder="Minimal 6 karakter" />
              </div>
              <div>
                <label className={labelClass}>Konfirmasi Password *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                  className={inputClass} placeholder="Ulangi password" />
              </div>

              {/* Data Kelahiran */}
              <SectionBox title="Data Kelahiran *">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Tempat Lahir *</label>
                    <input name="birth_place" value={form.birth_place} onChange={handleChange} required
                      className={inputClass} placeholder="Kota/kabupaten tempat lahir" />
                  </div>
                  <div>
                    <label className={labelClass}>Tanggal Lahir *</label>
                    <input name="birth_date" type="date" value={form.birth_date} onChange={handleChange} required
                      className={inputClass} />
                  </div>
                </div>
              </SectionBox>

              {/* Program Studi */}
              <SectionBox title="Program Studi *">
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Jurusan *</label>
                    <select name="program_id" value={form.program_id} onChange={handleChange} required
                      className={selectClass}>
                      <option value="">Pilih Program Studi</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Semester Saat Ini *</label>
                    <select name="current_semester" value={form.current_semester} onChange={handleChange} required
                      className={selectClass}>
                      <option value="">Pilih semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <option key={n} value={n}>Semester {n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SectionBox>

              {/* Alamat Mandarin */}
              <SectionBox title="Alamat Rumah (中文地址) *">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>縣市 *</label>
                      <input name="address_zh_city" value={form.address_zh_city} onChange={handleChange} required
                        className={inputClass} placeholder="台北市" />
                    </div>
                    <div>
                      <label className={labelClass}>區 *</label>
                      <input name="address_zh_district" value={form.address_zh_district} onChange={handleChange} required
                        className={inputClass} placeholder="信義區" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>路/街 *</label>
                    <input name="address_zh_road" value={form.address_zh_road} onChange={handleChange} required
                      className={inputClass} placeholder="信義路五段" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>號 *</label>
                      <input name="address_zh_number" value={form.address_zh_number} onChange={handleChange} required
                        className={inputClass} placeholder="7號" />
                    </div>
                    <div>
                      <label className={labelClass}>樓/室 (選填)</label>
                      <input name="address_zh_floor" value={form.address_zh_floor} onChange={handleChange}
                        className={inputClass} placeholder="3樓" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>郵遞區號 *</label>
                    <input name="postal_code" value={form.postal_code} onChange={handleChange} required
                      className={inputClass} placeholder="106" />
                  </div>
                </div>
              </SectionBox>

              {/* Bank section */}
              <div className="pt-2">
                <div className="mb-3">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Rekening Bank *</span>
                  <p className="text-xs text-[var(--text-body)] mt-0.5">Wajib isi minimal satu rekening (NTD atau IDR)</p>
                </div>
                <div className="space-y-3">
                  <SectionBox title="Rekening NTD (Taiwan)">
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Bank</label>
                        <select name="bank_ntd_code" value={form.bank_ntd_code} onChange={handleChange} className={selectClass}>
                          <option value="">Pilih Bank NTD</option>
                          {ntdBanks.map(b => (
                            <option key={b.code} value={b.code}>{b.display_label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Nomor Rekening</label>
                        <input name="bank_ntd_account" value={form.bank_ntd_account} onChange={handleChange}
                          className={inputClass} placeholder="Nomor rekening NTD" />
                      </div>
                    </div>
                  </SectionBox>

                  <SectionBox title="Rekening IDR (Indonesia)">
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Bank</label>
                        <select name="bank_idr_name" value={form.bank_idr_name} onChange={handleChange} className={selectClass}>
                          <option value="">Pilih Bank IDR</option>
                          {idrBanks.map(b => (
                            <option key={b.code} value={b.code}>{b.display_label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Nomor Rekening</label>
                        <input name="bank_idr_account" value={form.bank_idr_account} onChange={handleChange}
                          className={inputClass} placeholder="Nomor rekening IDR" />
                      </div>
                    </div>
                  </SectionBox>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
              >
                {loading ? <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Mendaftar...</> : 'Daftar Sekarang'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
