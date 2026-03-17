'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';
import { OrderDTO } from '@/types';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-slate-100 text-slate-500',
  failed: 'bg-red-100 text-red-700',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const data = await api.admin.listOrders();
      setOrders(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(orderId: string) {
    if (!confirm('Konfirmasi pembayaran pesanan ini?')) return;
    setConfirming(orderId);
    try {
      await api.admin.confirmPayment(orderId);
      await fetchOrders();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setConfirming(null);
    }
  }

  if (isLoading || loading) return <div className="text-center py-16 text-slate-400">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Panel Admin</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Pesanan & Pembayaran</h1>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Belum ada pesanan</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">No. Pesanan</th>
                <th className="px-4 py-3 text-left">Pelanggan</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
                <th className="px-4 py-3 text-center">Status Pesanan</th>
                <th className="px-4 py-3 text-center">Status Bayar</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(order => {
                const payment = order.payments?.[0];
                const canConfirm = order.status === 'pending' && payment?.status === 'pending';
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 font-medium">{order.shipping_name}</p>
                      <p className="text-slate-400 text-xs">{order.shipping_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatIDR(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment ? (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PAYMENT_STATUS_COLORS[payment.status] || 'bg-slate-100 text-slate-500'}`}>
                          {paymentStatusLabel(payment.status)}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      {canConfirm && (
                        <button
                          onClick={() => handleConfirm(order.id)}
                          disabled={confirming === order.id}
                          className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold"
                        >
                          {confirming === order.id ? 'Memproses...' : 'Konfirmasi Bayar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
