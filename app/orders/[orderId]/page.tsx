'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';

const ORDER_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

function OrderDetailContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === '1';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { router.push('/login'); return; }
    api.orders.get(orderId).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  }, [orderId, router]);

  async function handleCancel() {
    if (!confirm('Batalkan pesanan ini?')) return;
    setCancelling(true);
    try {
      await api.orders.cancel(orderId);
      const updated = await api.orders.get(orderId);
      setOrder(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!order) return <div className="text-center py-16 text-red-500">Pesanan tidak ditemukan</div>;

  const payment = order.payments?.[0];
  const stepIndex = ORDER_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl">
      <Link href="/orders" className="text-sm text-indigo-600 hover:underline">&larr; Semua Pesanan</Link>

      {isNew && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">
          Pesanan berhasil dibuat! Silakan lakukan pembayaran sesuai instruksi di bawah.
        </div>
      )}

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.order_number}</h1>
          <p className="text-sm text-slate-400 mt-1">{formatDate(order.created_at)}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {/* Progress */}
      {order.status !== 'cancelled' && (
        <div className="mt-6 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                  i < stepIndex
                    ? 'bg-indigo-600 text-white'
                    : i === stepIndex
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className="text-xs text-slate-500 mt-1 text-center leading-tight hidden sm:block">
                  {orderStatusLabel(step)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment info */}
        {payment && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Informasi Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-medium">{paymentStatusLabel(payment.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah</span>
                <span className="font-bold">{formatIDR(payment.amount)}</span>
              </div>
              {payment.expires_at && payment.status === 'pending' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Batas Bayar</span>
                  <span className="text-red-500">{formatDate(payment.expires_at)}</span>
                </div>
              )}
              {payment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Dibayar</span>
                  <span>{formatDate(payment.paid_at)}</span>
                </div>
              )}
            </div>

            {/* BCA transfer instructions for pending payments */}
            {payment.status === 'pending' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 space-y-1">
                <p className="font-semibold mb-2">Harap transfer ke rekening BCA:</p>
                <div className="flex justify-between">
                  <span className="text-blue-700">Atas nama</span>
                  <span className="font-medium">Nathasya Vira Nerisa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">No. Rekening</span>
                  <span className="font-mono font-bold tracking-wider">2950211345</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                  <span className="text-blue-700">Jumlah tepat</span>
                  <span className="font-bold text-blue-900">{formatIDR(payment.amount)}</span>
                </div>
                {payment.expires_at && (
                  <p className="text-xs text-red-600 mt-2">
                    Batas pembayaran: {formatDate(payment.expires_at)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shipping info */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Alamat Pengiriman</h2>
          <div className="text-sm text-slate-600 space-y-1">
            <p className="font-medium text-slate-900">{order.shipping_name}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''}</p>
            <p>{order.shipping_postal} {order.shipping_country}</p>
            <p>{order.shipping_phone}</p>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Daftar Modul</h2>
        <div className="space-y-0">
          <div className="flex items-center text-xs text-slate-400 pb-2 border-b border-slate-100">
            <span className="flex-1">Modul</span>
            <span className="w-24 text-right">Harga Satuan</span>
            <span className="w-24 text-right ml-4">Subtotal</span>
          </div>
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex items-center text-sm py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-mono text-xs text-slate-400 whitespace-nowrap">{item.module_code}</span>
                <span className="text-slate-900 truncate">{item.module_name}</span>
                {item.quantity > 1 && (
                  <span className="text-xs text-slate-400 whitespace-nowrap">×{item.quantity}</span>
                )}
              </div>
              <span className="w-24 text-right text-slate-500">{formatIDR(item.unit_price)}</span>
              <span className="w-24 text-right ml-4 font-medium text-slate-900">{formatIDR(item.subtotal)}</span>
            </div>
          ))}
          <div className="pt-3 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span className="text-indigo-700">{formatIDR(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {order.status === 'pending' && (
        <div className="mt-4 text-right">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors"
          >
            {cancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-slate-400">Memuat...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
