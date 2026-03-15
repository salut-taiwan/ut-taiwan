'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ScraperRunDTO } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-indigo-100 text-indigo-700 animate-pulse',
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AdminScraperPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [runs, setRuns] = useState<ScraperRunDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  async function loadRuns() {
    api.scraper.getRuns().then((data: any) => setRuns(data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.role === 'admin') loadRuns();
  }, [user]);

  async function handleTrigger() {
    setTriggering(true);
    setTriggerMessage('');
    try {
      const result: any = await api.scraper.run();
      setTriggerMessage(`Scraper dimulai! Run ID: ${result.runId}`);
      // Reload runs after a moment
      setTimeout(loadRuns, 2000);
    } catch (err: any) {
      setTriggerMessage(`Error: ${err.message}`);
    } finally {
      setTriggering(false);
    }
  }

  if (isLoading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Admin</Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Scraper TBO Karunika</h1>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-2">Jalankan Scraper Manual</h2>
        <p className="text-sm text-slate-500 mb-4">
          Scraper otomatis berjalan setiap hari pukul 02:00 WIB. Klik di bawah untuk memulai sinkronisasi manual.
        </p>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {triggering ? 'Memulai Scraper...' : 'Jalankan Sekarang'}
        </button>
        {triggerMessage && (
          <p className={`mt-3 text-sm ${triggerMessage.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
            {triggerMessage}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Riwayat Scraper Run</h2>
        </div>
        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat...</div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Belum ada riwayat scraper</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {runs.map(run => (
              <div key={run.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[run.status]}`}>
                      {run.status}
                    </span>
                    <span className="text-xs text-slate-400">{run.triggered_by}</span>
                  </div>
                  <p className="text-sm text-slate-700">{formatDate(run.started_at)}</p>
                  {run.error_message && (
                    <p className="text-xs text-red-500 mt-1 truncate">{run.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <span className="text-emerald-600 font-medium">+{run.modules_added}</span>
                  <span className="text-indigo-600 font-medium">~{run.modules_updated}</span>
                  <span className="text-red-500 font-medium">-{run.modules_removed}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">+Ditambahkan &bull; ~Diperbarui &bull; -Dihapus</p>
    </div>
  );
}
