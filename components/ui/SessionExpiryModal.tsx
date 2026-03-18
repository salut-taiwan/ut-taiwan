'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function SessionExpiryModal() {
  const { showExpiryWarning, isSessionExpired, stayLoggedIn, logout, dismissExpired } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState(300); // seconds
  const [staying, setStaying] = useState(false);

  // Reset and start countdown whenever warning appears
  useEffect(() => {
    if (!showExpiryWarning) {
      setCountdown(300);
      return;
    }
    const expiresAt = localStorage.getItem('ut_expires_at');
    if (expiresAt) {
      const secsLeft = Math.max(0, Math.floor(Number(expiresAt) - Date.now() / 1000));
      setCountdown(secsLeft);
    }
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [showExpiryWarning]);

  async function handleStayLoggedIn() {
    setStaying(true);
    await stayLoggedIn();
    setStaying(false);
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  function handleReLogin() {
    dismissExpired();
    router.push('/login');
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!showExpiryWarning && !isSessionExpired) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        {isSessionExpired ? (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 text-center mb-2">Sesi Berakhir</h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.
            </p>
            <button
              onClick={handleReLogin}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Masuk Kembali
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 text-center mb-2">Sesi Anda akan habis</h2>
            <p className="text-sm text-slate-500 text-center mb-2">
              Sesi Anda akan berakhir dalam 5 menit. Apakah Anda ingin tetap masuk?
            </p>
            <p className="text-2xl font-mono font-bold text-center text-amber-600 mb-6">
              {formatTime(countdown)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Keluar
              </button>
              <button
                onClick={handleStayLoggedIn}
                disabled={staying}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {staying ? 'Memproses...' : 'Tetap Masuk'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
