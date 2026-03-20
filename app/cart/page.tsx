'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CartDTO } from '@/types';
import { formatIDR } from '@/lib/utils';
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

  if (loading) return <div className="text-center py-16 text-slate-400">Memuat keranjang...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Keranjang Kosong</h2>
        <p className="text-slate-500 mb-6">Tambahkan modul dari program studi Anda</p>
        <Link href="/program" className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-sm">
          Pilih Program Studi
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Keranjang Belanja</h1>
          <button onClick={handleClear} className="text-sm text-red-500 hover:text-red-700 transition-colors">
            Kosongkan Keranjang
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
                <div className="bg-slate-50 rounded-lg w-16 h-20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.coverImageUrl ? (
                    <Image src={item.coverImageUrl} alt={item.moduleName} width={56} height={72}
                      className="object-contain" unoptimized />
                  ) : (
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-indigo-600 font-semibold">{item.tboCode}</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{item.moduleName}</p>
                  <p className="text-sm text-slate-500">{formatIDR(item.priceSnapshot)}</p>
                  {!item.isAvailable && (
                    <p className="text-xs text-red-500 mt-1">Modul tidak tersedia lagi</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-900">{formatIDR(item.subtotal)}</span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removing === item.id}
                    className="text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 sticky top-24">
              <h2 className="font-semibold text-slate-900 mb-4">Ringkasan Pesanan</h2>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{cart.itemCount} modul</span>
                  <span>{formatIDR(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos kirim</span>
                  <span className="text-slate-400">Dihitung saat checkout</span>
                </div>
              </div>
              <div className="border-t border-indigo-200 pt-4 mb-5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-900">Subtotal</span>
                  <span className="text-2xl font-bold text-indigo-700">{formatIDR(cart.subtotal)}</span>
                </div>
              </div>
              <button
                onClick={() => setShowTnC(true)}
                className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                Lanjut ke Checkout
              </button>
              <Link href="/program" className="block w-full text-center text-sm text-slate-500 mt-3 hover:text-slate-700 transition-colors">
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
