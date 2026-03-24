'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

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
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 min-h-[calc(100vh-4rem)] flex bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/50">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800" />
        
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full blur-3xl" />
        </div>
        
        <div className="relative flex flex-col items-center justify-center p-12 text-white w-full">
          <div className="max-w-md text-center">
            <div className="mb-8 animate-fade-in-up">
              <span className="text-4xl font-bold block mb-2">UT Taiwan</span>
              <span className="text-indigo-200 text-sm tracking-wide">Toko Modul Kuliah</span>
            </div>
            
            <p className="text-indigo-100/90 text-lg leading-relaxed mb-10 animate-fade-in-up animation-delay-100">
              Platform pembelian modul bahan ajar Universitas Terbuka untuk mahasiswa di Taiwan.
            </p>
            
            <div className="flex flex-col gap-4 animate-fade-in-up animation-delay-200">
              {[
                'Harga khusus mahasiswa UT',
                'Pengiriman langsung ke Taiwan',
                'Data modul selalu terupdate'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white/90">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className={cn(
            'bg-white rounded-3xl',
            'border border-slate-100',
            'shadow-[var(--shadow-elevated)]',
            'p-8 sm:p-10'
          )}>
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-600 bg-clip-text text-transparent">
                UT Taiwan
              </span>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang</h1>
            <p className="text-slate-500 mb-8">
              Belum punya akun?{' '}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                Daftar sekarang
              </Link>
            </p>

            {verified && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Email berhasil diverifikasi. Silakan masuk.</span>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-3 animate-scale-in">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={cn(
                    'w-full border-2 rounded-xl px-4 py-3 text-sm text-slate-900',
                    'placeholder:text-slate-400',
                    'transition-all duration-200',
                    'border-slate-200 hover:border-slate-300',
                    'focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                  )}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={cn(
                    'w-full border-2 rounded-xl px-4 py-3 text-sm text-slate-900',
                    'placeholder:text-slate-400',
                    'transition-all duration-200',
                    'border-slate-200 hover:border-slate-300',
                    'focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
                  )}
                  placeholder="Masukkan password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'bg-indigo-600 text-white py-3.5 rounded-xl',
                  'font-semibold text-base',
                  'shadow-[var(--shadow-btn-primary)]',
                  'hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(10,69,149,0.25)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  'active:scale-[0.98]'
                )}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Masuk...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
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
