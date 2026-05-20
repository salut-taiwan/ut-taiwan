'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ScraperRunDTO } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-indigo-50 border border-indigo-200 text-indigo-700 animate-pulse',
  success: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
  failed:  'bg-red-50    border border-red-200    text-red-700',
};

export default function AdminScraperPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [runs, setRuns] = useState<ScraperRunDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggeringPrefix, setTriggeringPrefix] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  async function loadRuns() {
    api.scraper.getRuns().then(data => setRuns(data)).finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.role === 'admin') loadRuns();
  }, [user]);

  async function handleTrigger() {
    setTriggering(true);
    setTriggerMessage('');
    try {
      const result = await api.scraper.run();
      setTriggerMessage(`Scraper dimulai! Run ID: ${result.runId}`);
      // Reload runs after a moment
      setTimeout(loadRuns, 2000);
    } catch (err: unknown) {
      setTriggerMessage(`Error: ${err instanceof Error ? err.message : 'Gagal memulai scraper'}`);
    } finally {
      setTriggering(false);
    }
  }

  async function handleTriggerPrefix() {
    setTriggeringPrefix(true);
    setTriggerMessage('');
    try {
      const result = await api.scraper.runPrefixes();
      setTriggerMessage(`Scraper prefix dimulai! Run ID: ${result.runId}`);
      setTimeout(loadRuns, 2000);
    } catch (err: unknown) {
      setTriggerMessage(`Error: ${err instanceof Error ? err.message : 'Gagal memulai scraper'}`);
    } finally {
      setTriggeringPrefix(false);
    }
  }

  if (isLoading) return <div className="text-center py-16 text-[var(--text-muted)]">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Admin</Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Scraper TBO Karunika</h1>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-[var(--foreground)] mb-2">Jalankan Scraper Manual</h2>
        <p className="text-sm text-[var(--text-body)] mb-4">
          Scraper otomatis berjalan setiap hari pukul 02:00 WIB. Klik di bawah untuk memulai sinkronisasi manual.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTrigger}
            disabled={triggering || triggeringPrefix}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {triggering ? 'Memulai Scraper...' : 'Jalankan Sekarang'}
          </button>
          <button
            onClick={handleTriggerPrefix}
            disabled={triggering || triggeringPrefix}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {triggeringPrefix ? 'Memulai...' : 'Scrape by Prefix (106 kode)'}
          </button>
        </div>
        {triggerMessage && (
          <p className={`mt-3 text-sm ${triggerMessage.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
            {triggerMessage}
          </p>
        )}
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--foreground)]">Riwayat Scraper Run</h2>
        </div>
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Memuat...</div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">Belum ada riwayat scraper</div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {runs.map(run => (
              <div key={run.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--surface-sunken)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[run.status]}`}>
                      {run.status}
                    </span>
                    <span className="text-xs text-[var(--text-body)]">{run.triggered_by}</span>
                  </div>
                  <p className="text-sm text-[var(--text-body)]">{run.started_at_display}</p>
                  {run.error_message && (
                    <p className="text-xs text-red-500 mt-1 truncate">{run.error_message}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm flex-shrink-0 tabular-nums">
                  <span className="text-emerald-600 font-medium">+{run.modules_added}</span>
                  <span className="text-indigo-600 font-medium">~{run.modules_updated}</span>
                  <span className="text-red-500 font-medium">-{run.modules_removed}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3 text-center">+Ditambahkan &bull; ~Diperbarui &bull; -Dihapus</p>
    </div>
  );
}
