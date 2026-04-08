'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { CartDTO } from '@/types';
import { formatIDR } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProfileAddress {
  name: string;
  phone: string;
  zh_city: string;
  zh_district: string;
  zh_road: string;
  zh_number: string;
  zh_floor: string;
  postal_code: string;
  country: string;
}

const inputClass = "w-full border border-[var(--border-default)] rounded-[10px] px-3.5 py-2.5 text-sm text-[var(--foreground)] bg-[var(--surface)] placeholder:text-[var(--text-muted)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-indigo-400 focus:ring-[3px] focus:ring-[var(--ring-focus)]";
const labelClass = "block text-sm font-medium text-[var(--foreground)] mb-1.5";

export default function CheckoutPage() {
  const router = useRouter();
  const { syncCartCount } = useCart();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [isSalut, setIsSalut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileAddress, setProfileAddress] = useState<ProfileAddress | null>(null);
  const [useProfileAddress, setUseProfileAddress] = useState(false);

  const [form, setForm] = useState({
    altName: '',
    altPhone: '',
    altZhCity: '',
    altZhDistrict: '',
    altZhRoad: '',
    altZhNumber: '',
    altZhFloor: '',
    altPostal: '',
    notes: '',
    paymentMethod: 'bank_transfer',
    paymentBank: 'BCA',
  });

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { router.push('/login'); return; }

    Promise.all([api.cart.get(), api.auth.getMe()]).then(([cartData, profileData]) => {
      setCart(cartData);
      setIsSalut(profileData.is_salut ?? false);
      const addr: ProfileAddress = {
        name: profileData.name || '',
        phone: profileData.phone || '',
        zh_city: profileData.address_zh_city || '',
        zh_district: profileData.address_zh_district || '',
        zh_road: profileData.address_zh_road || '',
        zh_number: profileData.address_zh_number || '',
        zh_floor: profileData.address_zh_floor || '',
        postal_code: profileData.postal_code || '',
        country: profileData.country || 'Taiwan',
      };
      const hasAddress = !!(addr.zh_city || addr.zh_road);
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
            shippingAddress: [
              profileAddress.zh_road,
              profileAddress.zh_number ? profileAddress.zh_number + '號' : '',
              profileAddress.zh_floor || '',
            ].filter(Boolean).join(' '),
            shippingCity: [profileAddress.zh_district, profileAddress.zh_city].filter(Boolean).join(''),
            shippingProvince: profileAddress.zh_city,
            shippingPostal: profileAddress.postal_code,
            shippingCountry: profileAddress.country,
            shippingPhone: profileAddress.phone,
          }
        : {
            shippingName: form.altName,
            shippingAddress: [
              form.altZhRoad,
              form.altZhNumber ? form.altZhNumber + '號' : '',
              form.altZhFloor || '',
            ].filter(Boolean).join(' '),
            shippingCity: [form.altZhDistrict, form.altZhCity].filter(Boolean).join(''),
            shippingProvince: form.altZhCity,
            shippingPostal: form.altPostal,
            shippingCountry: 'Taiwan',
            shippingPhone: form.altPhone,
          };
      const { order } = await api.orders.checkout({
        ...addressFields,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        paymentBank: form.paymentBank,
      });
      syncCartCount(0);
      router.push(`/orders/${order.id}?new=1`);
    } catch (err) {
      alert((err as Error).message || 'Gagal membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl">
      <div className="h-8 w-32 rounded skeleton mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 rounded-2xl skeleton" />
          <div className="h-16 rounded-xl skeleton" />
        </div>
        <div className="h-64 rounded-2xl skeleton" />
      </div>
    </div>
  );
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-body)]">Keranjang Anda kosong.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Shipping */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-6">
              <h2 className="font-semibold text-[var(--foreground)] mb-4">Alamat Pengiriman</h2>

              {/* Pill toggle — only show if profile has an address */}
              {profileAddress && (
                <div className="flex gap-1 bg-[var(--surface-sunken)] rounded-xl p-1 mb-5">
                  <button
                    type="button"
                    onClick={() => setUseProfileAddress(true)}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-[10px] text-sm font-medium transition-[background-color,color,box-shadow] duration-150',
                      useProfileAddress
                        ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    )}
                  >
                    Alamat Terdaftar
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseProfileAddress(false)}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-[10px] text-sm font-medium transition-[background-color,color,box-shadow] duration-150',
                      !useProfileAddress
                        ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    )}
                  >
                    Alamat Lain
                  </button>
                </div>
              )}

              {/* Read-only profile address card */}
              {useProfileAddress && profileAddress ? (
                <div className="bg-[var(--surface-sunken)] rounded-xl border border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-body)] space-y-0.5">
                  <p className="font-semibold text-[var(--foreground)]">{profileAddress.name}</p>
                  <p>
                    {[profileAddress.zh_road,
                      profileAddress.zh_number ? profileAddress.zh_number + '號' : '',
                      profileAddress.zh_floor || ''
                    ].filter(Boolean).join(' ')}
                  </p>
                  <p>
                    {[profileAddress.zh_district, profileAddress.zh_city].filter(Boolean).join('')}
                    {profileAddress.postal_code ? ` ${profileAddress.postal_code}` : ''}
                  </p>
                  <p>{profileAddress.country}</p>
                  <p>{profileAddress.phone}</p>
                </div>
              ) : (
                /* Editable form — Chinese address fields */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Nama Penerima *</label>
                    <input name="altName" value={form.altName} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>縣市 *</label>
                    <input name="altZhCity" value={form.altZhCity} onChange={handleChange} required className={inputClass} placeholder="台北市" />
                  </div>
                  <div>
                    <label className={labelClass}>區 *</label>
                    <input name="altZhDistrict" value={form.altZhDistrict} onChange={handleChange} required className={inputClass} placeholder="信義區" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>路/街 *</label>
                    <input name="altZhRoad" value={form.altZhRoad} onChange={handleChange} required className={inputClass} placeholder="信義路五段" />
                  </div>
                  <div>
                    <label className={labelClass}>號 *</label>
                    <input name="altZhNumber" value={form.altZhNumber} onChange={handleChange} required className={inputClass} placeholder="7號" />
                  </div>
                  <div>
                    <label className={labelClass}>樓/室 (選填)</label>
                    <input name="altZhFloor" value={form.altZhFloor} onChange={handleChange} className={inputClass} placeholder="3樓" />
                  </div>
                  <div>
                    <label className={labelClass}>郵遞區號 *</label>
                    <input name="altPostal" value={form.altPostal} onChange={handleChange} required className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nomor Telepon *</label>
                    <input name="altPhone" value={form.altPhone} onChange={handleChange} required type="tel" className={inputClass} />
                  </div>
                </div>
              )}

              {/* Notes — always visible */}
              <div className="mt-4">
                <label className={labelClass}>Catatan (opsional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                  placeholder="Instruksi khusus untuk pengiriman"
                  className={inputClass} />
              </div>
            </div>

            {/* Payment info */}
            <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold mb-1">Instruksi pembayaran</p>
                <p>Instruksi pembayaran akan dikirimkan melalui email setelah admin mengkonfirmasi ketersediaan stok. Anda tidak perlu melakukan transfer sekarang.</p>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-[var(--shadow-sm)] p-5 sticky top-24">
              <h2 className="font-semibold text-[var(--foreground)] mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between gap-2 items-start">
                    <span className="text-[var(--text-body)] truncate flex-1">
                      {item.tboCode} {item.moduleName}
                      {item.isRequest && (
                        <span className="ml-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">REQ</span>
                      )}
                      {item.quantity > 1 && (
                        <span className="ml-1 text-[var(--text-muted)] text-xs">×{item.quantity}</span>
                      )}
                    </span>
                    <span className="text-[var(--foreground)] font-medium whitespace-nowrap tabular-nums">
                      {item.isRequest && item.subtotal === 0 ? '—' : formatIDR(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
              {cart.items.some(i => i.isRequest) && (
                <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>Item bertanda <strong>REQ</strong> adalah permintaan. Admin akan mengkonfirmasi ketersediaan sebelum meminta pembayaran.</span>
                </div>
              )}
              <div className="border-t border-[var(--border-subtle)] pt-3 mb-5 space-y-1.5 text-sm">
                <div className="flex justify-between text-[var(--text-body)]">
                  <span>Subtotal Modul</span>
                  <span className="tabular-nums">{formatIDR(cart.subtotal)}</span>
                </div>
                {([
                  { label: 'Ongkir', amount: 300000 },
                  { label: 'Biaya Box', amount: 100000 },
                  { label: 'Biaya Admin', amount: 25000 },
                ] as { label: string; amount: number }[]).map(({ label, amount }) => (
                  <div key={label} className="flex justify-between text-[var(--text-body)] items-center">
                    <span>{label}</span>
                    {isSalut ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-[var(--text-muted)] line-through tabular-nums text-xs">{formatIDR(amount)}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">SALUT</span>
                      </span>
                    ) : (
                      <span className="tabular-nums">{formatIDR(amount)}</span>
                    )}
                  </div>
                ))}
                <div className="flex justify-between text-[var(--text-muted)] text-xs italic">
                  <span>Kode unik</span>
                  <span>+akan ditambahkan</span>
                </div>
                <div className="flex justify-between font-bold items-end pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--foreground)]">Total Pesanan</span>
                  <span className="text-2xl font-extrabold text-indigo-700 tabular-nums">
                    {formatIDR(cart.subtotal + (isSalut ? 0 : 425000))}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
              >
                {submitting
                  ? <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Memproses...</>
                  : 'Pesan Sekarang'
                }
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
