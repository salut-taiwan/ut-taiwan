'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CartDTO } from '@/types';
import { formatIDR } from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    shippingName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingProvince: '',
    shippingPostal: '',
    shippingCountry: 'Taiwan',
    shippingPhone: '',
    notes: '',
    paymentMethod: 'bank_transfer',
    paymentBank: 'BCA',
  });

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { router.push('/login'); return; }

    Promise.all([api.cart.get(), api.auth.getMe()]).then(([cartData, profileData]: any[]) => {
      setCart(cartData);
      setForm(f => ({
        ...f,
        shippingName: profileData.name || '',
        shippingAddress: profileData.shipping_address || '',
        shippingCity: profileData.city || '',
        shippingProvince: profileData.province || '',
        shippingPostal: profileData.postal_code || '',
        shippingPhone: profileData.phone || '',
      }));
    }).finally(() => setLoading(false));
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { order } = await api.orders.checkout(form) as any;
      router.push(`/orders/${order.id}?new=1`);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Keranjang Anda kosong.</p>
      </div>
    );
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 bg-white";

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Alamat Pengiriman</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Nama Penerima *</label>
                  <input name="shippingName" value={form.shippingName} onChange={handleChange} required
                    className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Alamat Lengkap *</label>
                  <textarea name="shippingAddress" value={form.shippingAddress} onChange={handleChange} required rows={3}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Kota *</label>
                  <input name="shippingCity" value={form.shippingCity} onChange={handleChange} required
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Provinsi/Negara Bagian</label>
                  <input name="shippingProvince" value={form.shippingProvince} onChange={handleChange}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Kode Pos</label>
                  <input name="shippingPostal" value={form.shippingPostal} onChange={handleChange}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Negara</label>
                  <input name="shippingCountry" value={form.shippingCountry} onChange={handleChange}
                    className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Nomor Telepon *</label>
                  <input name="shippingPhone" value={form.shippingPhone} onChange={handleChange} required
                    type="tel"
                    className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-slate-700 mb-1 font-medium">Catatan (opsional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                    placeholder="Instruksi khusus untuk pengiriman"
                    className={inputClass} />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Pembayaran</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 space-y-1">
                <p className="font-semibold mb-2">Transfer ke rekening BCA:</p>
                <div className="flex justify-between">
                  <span className="text-blue-700">Atas nama</span>
                  <span className="font-medium">Nathasya Vira Nerisa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">No. Rekening</span>
                  <span className="font-mono font-bold tracking-wider">2950211345</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                  <span className="text-blue-700">Jumlah transfer</span>
                  <span className="font-bold text-blue-900 text-base">{formatIDR(cart.subtotal)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Transfer tepat sesuai jumlah di atas. Pembayaran kadaluarsa dalam 3 hari setelah pesanan dibuat.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 sticky top-24">
              <h2 className="font-semibold text-slate-900 mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between gap-2">
                    <span className="text-slate-600 truncate">{item.tboCode} {item.moduleName}</span>
                    <span className="text-slate-900 font-medium whitespace-nowrap">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-indigo-200 pt-3 mb-5">
                <div className="flex justify-between text-slate-500 text-sm mb-1">
                  <span>Subtotal</span>
                  <span>{formatIDR(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm mb-3">
                  <span>Ongkos Kirim</span>
                  <span>{formatIDR(0)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-900">Total yang harus ditransfer</span>
                  <span className="text-2xl font-bold text-indigo-700">{formatIDR(cart.subtotal)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {submitting ? 'Memproses...' : 'Pesan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
