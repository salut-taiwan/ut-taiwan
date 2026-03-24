'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CartDTO } from '@/types';
import { formatIDR, cn } from '@/lib/utils';
import { useCart } from '@/lib/cart';

export default function CartPage() {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showTnC, setShowTnC] = useState(false);
  const [tncAgreed, setTncAgreed] = useState(false);
  const { refreshCart } = useCart();
  const router = useRouter();

  async function loadCart() {
    api.cart.get().then((data: any) => setCart(data)).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { window.location.href = '/login'; return; }
    loadCart();
  }, []);

  async function handleRemove(itemId: string) {
    setRemoving(itemId);
    await api.cart.removeItem(itemId);
    await loadCart();
    await refreshCart();
    setRemoving(null);
  }

  async function handleClear() {
    if (!confirm('Kosongkan semua isi keranjang?')) return;
    await api.cart.clear();
    await loadCart();
    await refreshCart();
  }

  function closeTnC() {
    setShowTnC(false);
    setTncAgreed(false);
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl animate-fade-in">
        <div className="h-8 w-48 skeleton rounded-lg mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
                <div className="w-16 h-20 rounded-xl skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 skeleton rounded" />
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-3 w-24 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="h-64 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-100 mb-8">
          <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Keranjang Kosong</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Belum ada modul di keranjang Anda. Mulai belanja dengan memilih program studi Anda.
        </p>
        <Link 
          href="/program" 
          className={cn(
            'inline-flex items-center gap-2',
            'bg-indigo-600 text-white px-8 py-4 rounded-2xl',
            'font-semibold text-base',
            'shadow-[var(--shadow-btn-primary)]',
            'hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(10,69,149,0.25)]',
            'transition-all duration-200',
            'active:scale-[0.98]'
          )}
        >
          Pilih Program Studi
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Keranjang Belanja</h1>
            <p className="text-slate-500">{cart.itemCount} modul dalam keranjang</p>
          </div>
          <button 
            onClick={handleClear} 
            className={cn(
              'inline-flex items-center gap-2 text-sm font-medium',
              'text-slate-500 hover:text-red-600',
              'px-3 py-2 rounded-xl hover:bg-red-50',
              'transition-all duration-200'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Kosongkan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item, index) => (
              <div 
                key={item.id} 
                style={{ animationDelay: `${index * 50}ms` }}
                className={cn(
                  'group bg-white rounded-2xl border border-slate-100',
                  'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
                  'p-5 flex items-center gap-5',
                  'transition-all duration-300',
                  'animate-fade-in-up'
                )}
              >
                {/* Image */}
                <div className="bg-gradient-to-b from-slate-50 to-slate-100/50 rounded-xl w-20 h-24 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.coverImageUrl ? (
                    <Image 
                      src={item.coverImageUrl} 
                      alt={item.moduleName} 
                      width={64} 
                      height={80}
                      className="object-contain transition-transform duration-300 group-hover:scale-105" 
                      unoptimized 
                    />
                  ) : (
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mb-1.5">
                    {item.tboCode}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1 mb-1">{item.moduleName}</p>
                  <p className="text-sm text-slate-500 tabular-nums">{formatIDR(item.priceSnapshot)}</p>
                  {!item.isAvailable && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-red-500 mt-2 bg-red-50 px-2 py-1 rounded-md">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Tidak tersedia lagi
                    </div>
                  )}
                </div>
                
                {/* Price & Remove */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-base font-bold text-slate-900 tabular-nums">{formatIDR(item.subtotal)}</span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removing === item.id}
                    className={cn(
                      'p-2 rounded-xl',
                      'text-slate-400 hover:text-red-500 hover:bg-red-50',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      'transition-all duration-200'
                    )}
                  >
                    {removing === item.id ? (
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className={cn(
              'bg-gradient-to-b from-indigo-50 to-indigo-100/50',
              'border border-indigo-100 rounded-2xl p-6',
              'sticky top-24',
              'shadow-[var(--shadow-card)]'
            )}>
              <h2 className="font-bold text-lg text-slate-900 mb-5">Ringkasan Pesanan</h2>
              
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal ({cart.itemCount} modul)</span>
                  <span className="font-medium text-slate-700 tabular-nums">{formatIDR(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ongkos kirim</span>
                  <span className="text-slate-400 text-xs">Dihitung saat checkout</span>
                </div>
              </div>
              
              <div className="border-t border-indigo-200 pt-5 mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-slate-700">Total</span>
                  <span className="text-2xl font-bold text-indigo-700 tabular-nums">{formatIDR(cart.subtotal)}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowTnC(true)}
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'bg-indigo-600 text-white py-3.5 rounded-xl',
                  'font-semibold text-base',
                  'shadow-[var(--shadow-btn-primary)]',
                  'hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(10,69,149,0.25)]',
                  'transition-all duration-200',
                  'active:scale-[0.98]'
                )}
              >
                Lanjut ke Checkout
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              
              <Link 
                href="/program" 
                className="flex items-center justify-center gap-2 w-full text-sm text-slate-500 mt-4 py-2 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Tambah Modul Lagi
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* T&C Modal */}
      {showTnC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Ketentuan Pemesanan Buku</h2>
              <p className="text-sm text-slate-500 mt-1">Harap baca seluruh ketentuan sebelum melanjutkan pemesanan.</p>
            </div>

            {/* Scrollable clauses */}
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900 mb-1">1. Pengisian Alamat</p>
                <p>Pembeli wajib mengisi alamat pengiriman secara lengkap dan benar sebelum melakukan pemesanan. Kesalahan pengisian alamat menjadi tanggung jawab pembeli.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">2. Format Alamat</p>
                <p>Alamat pengiriman <span className="font-medium">wajib ditulis dalam bahasa Mandarin</span>, mencakup nama jalan, nomor bangunan, kelurahan/kecamatan, kota, dan kode pos.</p>
                <p className="mt-1 bg-slate-50 rounded-lg px-3 py-2 font-mono text-xs text-slate-600">Contoh: 台北市大安區基隆路4段43號</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">3. Ketersediaan Buku</p>
                <p>Ketersediaan buku bergantung pada stok dari distributor. Jika buku tidak tersedia, pihak pengelola akan menghubungi pembeli untuk konfirmasi lebih lanjut.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">4. Penentuan Harga</p>
                <p>Harga yang tertera adalah harga per eksemplar pada saat pemesanan. Harga dapat berubah sewaktu-waktu mengikuti kebijakan distributor (TBO Karunika).</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">5. Perbedaan Biaya Mahasiswa SALUT dan Non-SALUT</p>
                <p>Mahasiswa <span className="font-medium">non-SALUT</span> dikenakan biaya tambahan sebesar <span className="font-medium">Rp 425.000</span> per semester, yang mencakup:</p>
                <ul className="mt-1 ml-4 list-disc space-y-0.5 text-slate-600">
                  <li>Biaya administrasi layanan pengiriman internasional</li>
                  <li>Biaya penanganan (handling fee)</li>
                  <li>Selisih kurs dan biaya transfer antarnegara</li>
                </ul>
                <p className="mt-1">Mahasiswa <span className="font-medium">SALUT</span> tidak dikenakan biaya tambahan ini.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">6. Pembayaran</p>
                <p>Pembayaran dilakukan melalui metode yang tersedia di platform ini. Pesanan akan diproses setelah pembayaran dikonfirmasi. Batas waktu pembayaran adalah <span className="font-medium">5 × 24 jam</span> sejak pesanan dibuat.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">7. Kebijakan Pengembalian Dana</p>
                <p>Pengembalian dana (<em>refund</em>) <span className="font-medium text-red-600">tidak dapat dilakukan</span> apabila kesalahan terjadi akibat kelalaian pemesan, termasuk namun tidak terbatas pada: kesalahan pemilihan modul, kesalahan alamat, atau pembatalan sepihak setelah pembayaran dikonfirmasi.</p>
              </div>
            </div>

            {/* Checkbox */}
            <div className="px-6 py-4 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tncAgreed}
                  onChange={e => setTncAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm text-slate-700">
                  Saya telah membaca dan menyetujui seluruh ketentuan di atas.
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={closeTnC}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button
                disabled={!tncAgreed}
                onClick={() => router.push('/checkout')}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                Lanjut ke Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
