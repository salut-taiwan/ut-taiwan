'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '', nim: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      await api.auth.register({
        email: form.email,
        password: form.password,
        name: form.name,
        nim: form.nim || undefined,
        phone: form.phone || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="max-w-md text-center p-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Cek Email Anda</h2>
          <p className="text-slate-600 mb-6">
            Link verifikasi telah dikirim ke <strong>{form.email}</strong>. Silakan klik link tersebut untuk mengaktifkan akun Anda.
          </p>
          <Link href="/login" className="text-indigo-600 hover:underline text-sm font-medium">Kembali ke Halaman Masuk</Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900";

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 min-h-[calc(100vh-4rem)] flex bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center">
          <span className="text-4xl font-bold block mb-2">UT Taiwan</span>
          <span className="text-indigo-200 text-sm block mb-8">Toko Modul Kuliah</span>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Daftar sekarang dan mulai belanja modul kuliah Universitas Terbuka dari Taiwan dengan mudah.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Daftar Akun</h1>
            <p className="text-sm text-slate-500 mb-6">
              Sudah punya akun? <Link href="/login" className="text-indigo-600 hover:underline font-medium">Masuk</Link>
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className={inputClass}
                  placeholder="Nama lengkap sesuai KTP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className={inputClass}
                  placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIM (opsional)</label>
                <input name="nim" value={form.nim} onChange={handleChange}
                  className={inputClass}
                  placeholder="Nomor Induk Mahasiswa UT" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp (opsional)</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                  className={inputClass}
                  placeholder="+886 xxx xxx xxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required
                  className={inputClass}
                  placeholder="Minimal 6 karakter" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password *</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                  className={inputClass}
                  placeholder="Ulangi password" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
