'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { CartDTO } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

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
  const { user, isLoading: authLoading } = useAuth();
  const { syncCartCount } = useCart();
  const { showToast } = useToast();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [profileAddressLines, setProfileAddressLines] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileAddress, setProfileAddress] = useState<ProfileAddress | null>(null);
  const [useProfileAddress, setUseProfileAddress] = useState(false);
  const [customItems, setCustomItems] = useState<{ code: string; name: string }[]>([]);
  const [draftCode, setDraftCode] = useState('');
  const [draftName, setDraftName] = useState('');

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
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    const stored = sessionStorage.getItem('cart_custom_items');
    if (stored) {
      try { setCustomItems(JSON.parse(stored)); } catch {}
      sessionStorage.removeItem('cart_custom_items');
    }

    Promise.all([api.cart.get(), api.auth.getMe()]).then(([cartData, profileData]) => {
      setCart(cartData);
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
        setProfileAddressLines(profileData.shipping_address_lines ?? null);
        setUseProfileAddress(true);
      }
    }).finally(() => setLoading(false));
  }, [authLoading, user, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Submit structured Mandarin address fields; backend composes shippingAddress + shippingCity.
      const src = useProfileAddress && profileAddress
        ? {
            name: profileAddress.name,
            zh_road: profileAddress.zh_road,
            zh_number: profileAddress.zh_number,
            zh_floor: profileAddress.zh_floor,
            zh_city: profileAddress.zh_city,
            zh_district: profileAddress.zh_district,
            postal: profileAddress.postal_code,
            phone: profileAddress.phone,
            country: profileAddress.country,
          }
        : {
            name: form.altName,
            zh_road: form.altZhRoad,
            zh_number: form.altZhNumber,
            zh_floor: form.altZhFloor,
            zh_city: form.altZhCity,
            zh_district: form.altZhDistrict,
            postal: form.altPostal,
            phone: form.altPhone,
            country: 'Taiwan',
          };
      const { order } = await api.orders.checkout({
        shipping_name: src.name,
        shipping_zh_road: src.zh_road,
        shipping_zh_number: src.zh_number,
        shipping_zh_floor: src.zh_floor,
        shipping_zh_city: src.zh_city,
        shipping_zh_district: src.zh_district,
        shipping_postal: src.postal,
        shipping_phone: src.phone,
        shippingProvince: src.zh_city,
        shippingCountry: src.country,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        paymentBank: form.paymentBank,
        customItems: customItems.map(ci => ({ moduleCode: ci.code, moduleName: ci.name || ci.code })),
      });
      syncCartCount(0);
      router.push(`/orders/${order.id}?new=1`);
    } catch (err) {
      showToast((err as Error).message || 'Gagal membuat pesanan', 'error');
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
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <svg className="w-16 h-16 text-[var(--border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Keranjang kosong</h2>
        <p className="text-sm text-[var(--text-muted)]">Tambahkan modul ke keranjang sebelum checkout.</p>
        <Link href="/modules" className="mt-1 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
          Lihat Modul
        </Link>
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

              {/* Pill toggle - only show if profile has an address */}
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

              {/* Read-only profile address card - uses backend-composed lines */}
              {useProfileAddress && profileAddress ? (
                <div className="bg-[var(--surface-sunken)] rounded-xl border border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-body)] space-y-0.5">
                  {(profileAddressLines ?? []).map((line, i) => (
                    <p key={i} className={i === 0 ? 'font-semibold text-[var(--foreground)]' : ''}>{line}</p>
                  ))}
                </div>
              ) : (
                /* Editable form - Chinese address fields */
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

              {/* Notes - always visible */}
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
                <div>
                  <p className="font-semibold mb-1">Instruksi pembayaran</p>
                  <p>Instruksi pembayaran akan dikirimkan melalui email setelah admin mengkonfirmasi ketersediaan stok. Anda tidak perlu melakukan transfer sekarang.</p>
                  <a href="/panduan#pembayaran" className="inline-block mt-2 text-xs text-blue-600 hover:underline font-medium">Panduan cara bayar SPP UT &rarr;</a>
                </div>
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
                      {item.itemType === 'module' ? `${item.tboCode} ${item.moduleName}` : item.productNameSnapshot}
                      {item.itemType === 'merch' && item.variantLabel && (
                        <span className="ml-1 text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{item.variantLabel}</span>
                      )}
                      {item.isRequest && (
                        <span className="ml-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">REQ</span>
                      )}
                      {item.quantity > 1 && (
                        <span className="ml-1 text-[var(--text-muted)] text-xs">×{item.quantity}</span>
                      )}
                    </span>
                    <span className="text-[var(--foreground)] font-medium whitespace-nowrap tabular-nums">
                      {item.isRequest && item.subtotal === 0 ? '-' : item.subtotalDisplay}
                    </span>
                  </div>
                ))}
                {customItems.map((ci, idx) => (
                  <div key={`custom-${idx}`} className="flex justify-between gap-2 items-start">
                    <span className="text-[var(--text-body)] truncate flex-1">
                      {ci.code}{ci.name && ci.name !== ci.code ? ` ${ci.name}` : ''}
                      <span className="ml-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">REQ</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[var(--foreground)] font-medium tabular-nums">-</span>
                      <button
                        type="button"
                        onClick={() => setCustomItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add unlisted module */}
              <div className="mb-4 border border-[var(--border-subtle)] rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-[var(--text-body)]">Tambah Modul Lain</p>
                <input
                  type="text"
                  value={draftCode}
                  onChange={e => setDraftCode(e.target.value.slice(0, 30))}
                  placeholder="Kode TBO, misal EKMA4111"
                  className="w-full border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] bg-[var(--surface)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[var(--ring-focus)] transition-[border-color,box-shadow] duration-150"
                />
                <input
                  type="text"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  placeholder="Nama modul (opsional)"
                  className="w-full border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] bg-[var(--surface)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-[var(--ring-focus)] transition-[border-color,box-shadow] duration-150"
                />
                <button
                  type="button"
                  disabled={!draftCode.trim()}
                  onClick={() => {
                    if (!draftCode.trim()) return;
                    setCustomItems(prev => [...prev, { code: draftCode.trim(), name: draftName.trim() }]);
                    setDraftCode('');
                    setDraftName('');
                  }}
                  className="w-full py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  + Tambah
                </button>
              </div>

              {(cart.items.some(i => i.isRequest) || customItems.length > 0) && (
                <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>Item bertanda <strong>REQ</strong> adalah permintaan. Admin akan mengkonfirmasi ketersediaan sebelum meminta pembayaran.</span>
                </div>
              )}
              {/* SALUT upsell / status banner */}
              {!(user?.is_salut_active) && (
                <div className="mb-3">
                  {user?.salut_status === 'pending' ? (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Permohonan SALUT Anda sedang diproses</span>
                    </div>
                  ) : user?.salut_status === 'rejected' ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-800">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Permohonan SALUT ditolak. <Link href="/salut/apply" className="font-semibold underline">Coba lagi →</Link></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5 text-xs text-indigo-800">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Anggota SALUT hemat {cart.total_breakdown?.fee_lines.reduce((acc, l) => acc + (l.original_amount ?? l.amount), 0) ? '' : ''}<span className="font-semibold">{cart.total_breakdown && cart.total_breakdown.fee_lines.length > 0 ? cart.total_breakdown.fee_lines[0].original_amount_display ?? '' : ''}</span> di pesanan ini. <Link href="/salut" className="font-semibold underline">Pelajari →</Link></span>
                    </div>
                  )}
                </div>
              )}
              <div className="border-t border-[var(--border-subtle)] pt-3 mb-5 space-y-1.5 text-sm">
                <div className="flex justify-between text-[var(--text-body)]">
                  <span>Subtotal Modul</span>
                  <span className="tabular-nums">{cart.subtotal_display}</span>
                </div>
                {cart.total_breakdown?.fee_lines.map((line) => (
                  <div key={line.key} className="flex justify-between text-[var(--text-body)] items-center">
                    <span>{line.label}</span>
                    {line.is_waived ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-[var(--text-muted)] line-through tabular-nums text-xs">{line.original_amount_display}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">SALUT</span>
                      </span>
                    ) : (
                      <span className="tabular-nums">{line.amount_display}</span>
                    )}
                  </div>
                ))}
                <div className="flex justify-between text-[var(--text-muted)] text-xs italic">
                  <span>Kode unik (verifikasi pembayaran)</span>
                  <span>+Rp 100 – Rp 500</span>
                </div>
                <div className="flex justify-between font-bold items-end pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[var(--foreground)]">Total Pesanan</span>
                  <span className="text-2xl font-extrabold text-indigo-700 tabular-nums">
                    {cart.total_breakdown?.total_display ?? '...'}
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
