'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CartDTO } from '@/types';
import { formatIDR } from '@/lib/utils';

const BANKS = ['BCA', 'BRI', 'Mandiri', 'BNI'];
const PAYMENT_METHODS = [
  { value: 'virtual_account', label: 'Virtual Account Bank' },
  { value: 'bank_transfer', label: 'Transfer Bank Manual' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [profile, setProfile] = useState<any>(null);
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
    paymentMethod: 'virtual_account',
    paymentBank: 'BCA',
  });

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { router.push('/login'); return; }

    Promise.all([api.cart.get(), api.auth.getMe()]).then(([cartData, profileData]: any[]) => {
      setCart(cartData);
      setProfile(profileData);
      // Pre-fill from profile
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

  if (loading) return <div className="text-center py-16 text-gray-400">Memuat...</div>;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Keranjang Anda kosong.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Alamat Pengiriman</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Nama Penerima *</label>
                  <input name="shippingName" value={form.shippingName} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Alamat Lengkap *</label>
                  <textarea name="shippingAddress" value={form.shippingAddress} onChange={handleChange} required rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Kota *</label>
                  <input name="shippingCity" value={form.shippingCity} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Provinsi/Negara Bagian</label>
                  <input name="shippingProvince" value={form.shippingProvince} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Kode Pos</label>
                  <input name="shippingPostal" value={form.shippingPostal} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Negara</label>
                  <input name="shippingCountry" value={form.shippingCountry} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Nomor Telepon *</label>
                  <input name="shippingPhone" value={form.shippingPhone} onChange={handleChange} required
                    type="tel"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Catatan (opsional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                    placeholder="Instruksi khusus untuk pengiriman"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
              <div className="space-y-3 mb-4">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.value} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="paymentMethod" value={pm.value}
                      checked={form.paymentMethod === pm.value}
                      onChange={handleChange}
                      className="accent-blue-600" />
                    <span className="text-sm text-gray-800">{pm.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Bank</label>
                <select name="paymentBank" value={form.paymentBank} onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Pembayaran kadaluarsa dalam 3 hari. Instruksi pembayaran akan dikirim ke email Anda.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between gap-2">
                    <span className="text-gray-600 truncate">{item.tboCode} {item.moduleName}</span>
                    <span className="text-gray-900 font-medium whitespace-nowrap">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 mb-5">
                <div className="flex justify-between text-gray-500 text-sm mb-1">
                  <span>Subtotal</span>
                  <span>{formatIDR(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm mb-3">
                  <span>Ongkos Kirim</span>
                  <span className="text-gray-400 text-xs">Akan dikonfirmasi</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatIDR(cart.subtotal)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
