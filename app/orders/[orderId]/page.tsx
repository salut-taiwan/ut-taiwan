'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';

const ORDER_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-gray-100 text-gray-700',
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
      setOrder((o: any) => ({ ...o, status: 'cancelled' }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Memuat...</div>;
  if (!order) return <div className="text-center py-16 text-red-500">Pesanan tidak ditemukan</div>;

  const payment = order.payments?.[0];
  const stepIndex = ORDER_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl">
      <Link href="/orders" className="text-sm text-blue-600 hover:underline">&larr; Semua Pesanan</Link>

      {isNew && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          Pesanan berhasil dibuat! Silakan lakukan pembayaran sesuai instruksi di bawah.
        </div>
      )}

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-sm text-gray-400 mt-1">{formatDate(order.created_at)}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {/* Progress */}
      {order.status !== 'cancelled' && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0" />
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                  i <= stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className="text-xs text-gray-500 mt-1 text-center leading-tight hidden sm:block">
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
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Informasi Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium">{paymentStatusLabel(payment.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Metode</span>
                <span>{payment.method} {payment.bank ? `(${payment.bank})` : ''}</span>
              </div>
              {payment.gateway_billing_no && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Nomor Billing</span>
                  <span className="font-mono font-bold text-blue-700">{payment.gateway_billing_no}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah</span>
                <span className="font-bold">{formatIDR(payment.amount)}</span>
              </div>
              {payment.expires_at && payment.status === 'pending' && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Batas Bayar</span>
                  <span className="text-red-500">{formatDate(payment.expires_at)}</span>
                </div>
              )}
              {payment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Dibayar</span>
                  <span>{formatDate(payment.paid_at)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Alamat Pengiriman</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">{order.shipping_name}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''}</p>
            <p>{order.shipping_postal} {order.shipping_country}</p>
            <p>{order.shipping_phone}</p>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Daftar Modul</h2>
        <div className="space-y-3">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-mono text-xs text-gray-400 whitespace-nowrap">{item.module_code}</span>
                <span className="text-gray-900 truncate">{item.module_name}</span>
              </div>
              <span className="font-medium text-gray-900 ml-4">{formatIDR(item.subtotal)}</span>
            </div>
          ))}
          <div className="pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{formatIDR(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {order.status === 'pending' && (
        <div className="mt-4 text-right">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-40"
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
    <Suspense fallback={<div className="text-center py-16 text-gray-400">Memuat...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
