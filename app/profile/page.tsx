'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { NTD_BANKS, IDR_BANKS } from '@/lib/banks';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { router.push('/login'); return; }
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
  }, [router]);

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
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Memuat profil...</div>;

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Profil Saya</h1>

      {saved && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3">
          Profil berhasil disimpan!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4">Informasi Pribadi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Nama Lengkap *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Email</label>
              <input value={profile?.email} disabled
                className="w-full border border-slate-100 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-400" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">NIM</label>
              <input name="nim" value={form.nim} onChange={handleChange}
                className={inputClass}
                placeholder="Nomor Induk Mahasiswa" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Nomor HP/WhatsApp</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                className={inputClass}
                placeholder="+886 xxx xxx xxx" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Tempat Lahir</label>
              <input name="birth_place" value={form.birth_place} onChange={handleChange}
                className={inputClass}
                placeholder="Kota/kabupaten tempat lahir" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Tanggal Lahir</label>
              <input name="birth_date" type="date" value={form.birth_date} onChange={handleChange}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Program Studi</label>
              <select name="program_id" value={form.program_id} onChange={handleChange}
                className={inputClass}>
                <option value="">Pilih Program Studi</option>
                {programs.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Semester Sekarang</label>
              <select name="current_semester" value={form.current_semester} onChange={handleChange}
                className={inputClass}>
                <option value="">Pilih Semester</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-1">Alamat Pengiriman Default</h2>
          <p className="text-xs text-slate-500 mb-4">Harap isi dalam bahasa Mandarin (請用中文填寫)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">縣市 *</label>
              <input name="address_zh_city" value={form.address_zh_city} onChange={handleChange}
                className={inputClass} placeholder="台北市" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">區 *</label>
              <input name="address_zh_district" value={form.address_zh_district} onChange={handleChange}
                className={inputClass} placeholder="信義區" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-700 mb-1 font-medium">路/街 *</label>
              <input name="address_zh_road" value={form.address_zh_road} onChange={handleChange}
                className={inputClass} placeholder="信義路五段" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">號 *</label>
              <input name="address_zh_number" value={form.address_zh_number} onChange={handleChange}
                className={inputClass} placeholder="7號" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">樓/室 (選填)</label>
              <input name="address_zh_floor" value={form.address_zh_floor} onChange={handleChange}
                className={inputClass} placeholder="3樓" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">郵遞區號 *</label>
              <input name="postal_code" value={form.postal_code} onChange={handleChange} required
                className={inputClass} placeholder="106" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4">Rekening Bank</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* NTD Bank */}
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Rekening NTD (Taiwan)</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Bank</label>
                  <select value={form.bank_ntd_code} onChange={handleNtdBankChange}
                    className={inputClass + ' bg-white'}>
                    <option value="">Pilih Bank NTD</option>
                    {NTD_BANKS.map((b: any) => (
                      <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Nomor Rekening</label>
                  <input name="bank_ntd_account" value={form.bank_ntd_account} onChange={handleChange}
                    className={inputClass}
                    placeholder="Nomor rekening NTD" />
                </div>
              </div>
            </div>

            {/* IDR Bank */}
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Rekening IDR (Indonesia)</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Bank</label>
                  <select name="bank_idr_name" value={form.bank_idr_name} onChange={handleChange}
                    className={inputClass + ' bg-white'}>
                    <option value="">Pilih Bank IDR</option>
                    {IDR_BANKS.map((b: any) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Nomor Rekening</label>
                  <input name="bank_idr_account" value={form.bank_idr_account} onChange={handleChange}
                    className={inputClass}
                    placeholder="Nomor rekening IDR" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}
