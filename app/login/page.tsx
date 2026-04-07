'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const inputClass = "w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]";
const labelClass = "block text-sm font-medium text-[var(--foreground)] mb-1.5";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified') === 'true';
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/program');
    } catch (err) {
      setError((err as Error).message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0A4595] flex-col items-center justify-center p-12 text-white">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-800/30 rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-8 w-40 h-40 bg-white/[0.02] rounded-full pointer-events-none" />

        <div className="relative max-w-sm text-center">
          <span className="text-4xl font-bold block mb-2 tracking-tight">UT Taiwan</span>
          <span className="text-indigo-200/80 text-sm block mb-8">Toko Modul Kuliah</span>
          <p className="text-indigo-100/90 text-lg leading-relaxed mb-8">
            Platform pembelian modul bahan ajar Universitas Terbuka untuk mahasiswa di Taiwan.
          </p>
          <div className="flex flex-col gap-3 text-sm text-indigo-200/90">
            {['Harga khusus mahasiswa UT', 'Pengiriman langsung ke Taiwan', 'Data modul selalu terupdate'].map(item => (
              <div key={item} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[var(--background)]">
        <div className="w-full max-w-md">
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border-subtle)] shadow-[var(--shadow-xl)] p-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Masuk</h1>
            <p className="text-sm text-[var(--text-body)] mb-6">
              Belum punya akun? <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Daftar sekarang</Link>
            </p>

            {verified && (
              <div className="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Email berhasil diverifikasi. Silakan masuk.
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
              >
                {loading ? <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Masuk...</> : 'Masuk'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
