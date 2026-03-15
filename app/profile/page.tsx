'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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
        shipping_address: p.shipping_address || '',
        city: p.city || '',
        province: p.province || '',
        postal_code: p.postal_code || '',
        country: p.country || 'Taiwan',
      });
    }).finally(() => setLoading(false));
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
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
          <h2 className="font-semibold text-slate-900 mb-4">Alamat Pengiriman Default</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-700 mb-1 font-medium">Alamat Lengkap</label>
              <textarea name="shipping_address" value={form.shipping_address} onChange={handleChange} rows={3}
                className={inputClass}
                placeholder="Alamat lengkap di Taiwan" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Kota</label>
              <input name="city" value={form.city} onChange={handleChange}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Provinsi/Kota</label>
              <input name="province" value={form.province} onChange={handleChange}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Kode Pos</label>
              <input name="postal_code" value={form.postal_code} onChange={handleChange}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1 font-medium">Negara</label>
              <input name="country" value={form.country} onChange={handleChange}
                className={inputClass} />
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
