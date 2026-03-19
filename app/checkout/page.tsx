'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CartDTO } from '@/types';
import { formatIDR } from '@/lib/utils';

interface ProfileAddress {
  name: string;
  shipping_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileAddress, setProfileAddress] = useState<ProfileAddress | null>(null);
  const [useProfileAddress, setUseProfileAddress] = useState(false);

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

    Promise.all([api.cart.get(), api.auth.getMe()]).then(([cartData, profileData]) => {
      setCart(cartData);
      const hasAddress = !!(profileData.shipping_address || profileData.city);
      const addr: ProfileAddress = {
        name: profileData.name || '',
        shipping_address: profileData.shipping_address || '',
        city: profileData.city || '',
        province: profileData.province || '',
        postal_code: profileData.postal_code || '',
        country: profileData.country || 'Taiwan',
        phone: profileData.phone || '',
      };
      if (hasAddress) {
        setProfileAddress(addr);
        setUseProfileAddress(true);
      }
    }).finally(() => setLoading(false));
  }, [router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const addressFields = useProfileAddress && profileAddress
        ? {
            shippingName: profileAddress.name,
            shippingAddress: profileAddress.shipping_address,
            shippingCity: profileAddress.city,
            shippingProvince: profileAddress.province,
            shippingPostal: profileAddress.postal_code,
            shippingCountry: profileAddress.country,
            shippingPhone: profileAddress.phone,
          }
        : {
            shippingName: form.shippingName,
            shippingAddress: form.shippingAddress,
            shippingCity: form.shippingCity,
            shippingProvince: form.shippingProvince,
            shippingPostal: form.shippingPostal,
            shippingCountry: form.shippingCountry,
            shippingPhone: form.shippingPhone,
          };
      const { order } = await api.orders.checkout({
        ...addressFields,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        paymentBank: form.paymentBank,
      });
      router.push(`/orders/${order.id}?new=1`);
    } catch (err) {
      alert((err as Error).message || 'Gagal membuat pesanan');
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

              {/* Toggle — only show if profile has an address */}
              {profileAddress && (
                <div className="flex rounded-lg border border-slate-200 overflow-hidden mb-5 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setUseProfileAddress(true)}
                    className={`flex-1 py-2 px-4 transition-colors ${useProfileAddress ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Alamat Terdaftar
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseProfileAddress(false)}
                    className={`flex-1 py-2 px-4 transition-colors ${!useProfileAddress ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Alamat Lain
                  </button>
                </div>
              )}

              {/* Read-only profile address card */}
              {useProfileAddress && profileAddress ? (
                <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 space-y-0.5">
                  <p className="font-semibold text-slate-900">{profileAddress.name}</p>
                  <p>{profileAddress.shipping_address}</p>
                  <p>{[profileAddress.city, profileAddress.province].filter(Boolean).join(', ')}{profileAddress.postal_code ? ` ${profileAddress.postal_code}` : ''}</p>
                  <p>{profileAddress.country}</p>
                  <p>{profileAddress.phone}</p>
                </div>
              ) : (
                /* Editable form */
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
                </div>
              )}

              {/* Notes — always visible */}
              <div className="mt-4">
                <label className="block text-sm text-slate-700 mb-1 font-medium">Catatan (opsional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                  placeholder="Instruksi khusus untuk pengiriman"
                  className={inputClass} />
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">ℹ Instruksi pembayaran</p>
              <p>Instruksi pembayaran akan dikirimkan melalui email setelah admin mengkonfirmasi ketersediaan stok. Anda tidak perlu melakukan transfer sekarang.</p>
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
                  <span className="text-slate-900">Total Pesanan</span>
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
