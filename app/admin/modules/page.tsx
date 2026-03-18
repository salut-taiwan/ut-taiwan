'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';

const EMPTY_FORM = {
  tbo_code: '', name: '', price_student: '', price_general: '',
  edition: '', author: '', publisher: 'Universitas Terbuka',
  weight_grams: '', cover_image_url: '', tbo_url: '',
  is_available: true, has_multimedia: false,
};

export default function AdminModulesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const LIMIT = 30;

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchModules();
  }, [page, user]);

  function fetchModules() {
    setLoading(true);
    api.modules.list(page, LIMIT).then((data: any) => {
      setModules(data.data || []);
      setTotal(data.total || 0);
    }).finally(() => setLoading(false));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.modules.create({
        tbo_code: form.tbo_code,
        name: form.name,
        price_student: Number(form.price_student),
        price_general: Number(form.price_general),
        edition: form.edition || undefined,
        author: form.author || undefined,
        publisher: form.publisher || undefined,
        weight_grams: form.weight_grams ? Number(form.weight_grams) : undefined,
        cover_image_url: form.cover_image_url || undefined,
        tbo_url: form.tbo_url || undefined,
        is_available: form.is_available,
        has_multimedia: form.has_multimedia,
      });
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      fetchModules();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  if (isLoading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Admin</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Manajemen Modul</h1>
          <p className="text-sm text-slate-500">{total} modul total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          + Tambah Modul
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Kode</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Nama</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Edisi</th>
                <th className="text-right px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Harga Mhs</th>
                <th className="text-center px-4 py-3 text-slate-500 text-xs uppercase tracking-wide font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map(mod => (
                <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600 font-semibold">{mod.tbo_code}</td>
                  <td className="px-4 py-3 text-slate-900 max-w-xs truncate">{mod.name}</td>
                  <td className="px-4 py-3 text-slate-500">{mod.edition || '-'}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{mod.price_student ? formatIDR(mod.price_student) : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      mod.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {mod.is_available ? 'Tersedia' : 'Tidak'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 text-slate-700">
            Sebelumnya
          </button>
          <span className="px-4 py-2 text-sm text-slate-600">Halaman {page} dari {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 text-slate-700">
            Selanjutnya
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Tambah Modul Baru</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kode TBO *</label>
                  <input
                    type="text"
                    value={form.tbo_code}
                    onChange={e => setForm(f => ({ ...f, tbo_code: e.target.value }))}
                    required
                    placeholder="ADBI4201"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Edisi</label>
                  <input
                    type="text"
                    value={form.edition}
                    onChange={e => setForm(f => ({ ...f, edition: e.target.value }))}
                    placeholder="1"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Modul *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Pengantar Bisnis"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Mahasiswa (Rp) *</label>
                  <input
                    type="number"
                    value={form.price_student}
                    onChange={e => setForm(f => ({ ...f, price_student: e.target.value }))}
                    required
                    min={0}
                    placeholder="25000"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Umum (Rp) *</label>
                  <input
                    type="number"
                    value={form.price_general}
                    onChange={e => setForm(f => ({ ...f, price_general: e.target.value }))}
                    required
                    min={0}
                    placeholder="35000"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pengarang</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  placeholder="Nama pengarang"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Penerbit</label>
                <input
                  type="text"
                  value={form.publisher}
                  onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Berat (gram)</label>
                <input
                  type="number"
                  value={form.weight_grams}
                  onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))}
                  min={0}
                  placeholder="300"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL Sampul</label>
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL TBO</label>
                <input
                  type="url"
                  value={form.tbo_url}
                  onChange={e => setForm(f => ({ ...f, tbo_url: e.target.value }))}
                  placeholder="https://tbo.karunika.co.id/..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                    className="rounded"
                  />
                  Tersedia
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_multimedia}
                    onChange={e => setForm(f => ({ ...f, has_multimedia: e.target.checked }))}
                    className="rounded"
                  />
                  Multimedia
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setForm({ ...EMPTY_FORM }); }}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold"
                >
                  {creating ? 'Menyimpan...' : 'Simpan Modul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
