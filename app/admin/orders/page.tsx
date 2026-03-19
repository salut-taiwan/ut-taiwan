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
  pending: 'bg-slate-100 text-slate-600',
  awaiting_payment: 'bg-amber-100 text-amber-700',
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
  const [confirmingKarunika, setConfirmingKarunika] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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

  async function handleStatusUpdate(orderId: string, newStatus: string, label: string) {
    if (!confirm(`${label} pesanan ini?`)) return;
    setUpdatingStatus(orderId);
    try {
      await api.admin.updateOrderStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleConfirmKarunika(orderId: string) {
    if (!confirm('Konfirmasi stok Karunika tersedia? Email instruksi pembayaran akan dikirim ke pelanggan.')) return;
    setConfirmingKarunika(orderId);
    try {
      await api.admin.confirmKarunika(orderId);
      await fetchOrders();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setConfirmingKarunika(null);
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
                const canConfirmKarunika = order.status === 'pending';
                const canConfirmPayment = order.status === 'awaiting_payment' && payment?.status === 'pending';
                const busy = confirming === order.id || confirmingKarunika === order.id || updatingStatus === order.id;
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
                      <div className="flex flex-col gap-1 items-center">
                        {canConfirmKarunika && (
                          <button
                            onClick={() => handleConfirmKarunika(order.id)}
                            disabled={busy}
                            className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            {confirmingKarunika === order.id ? 'Memproses...' : 'Konfirmasi Karunika'}
                          </button>
                        )}
                        {canConfirmPayment && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            disabled={busy}
                            className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            {confirming === order.id ? 'Memproses...' : 'Konfirmasi Bayar'}
                          </button>
                        )}
                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'processing', 'Proses')}
                            disabled={busy}
                            className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Proses
                          </button>
                        )}
                        {(order.status === 'paid' || order.status === 'processing') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'shipped', 'Kirim')}
                            disabled={busy}
                            className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Kirim
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'delivered', 'Terima')}
                            disabled={busy}
                            className="bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Terima
                          </button>
                        )}
                      </div>
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
