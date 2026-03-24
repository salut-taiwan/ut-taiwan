'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';
import { OrderDTO } from '@/types';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50   border-l-[3px] border-l-amber-400   text-amber-800  rounded-r-sm',
  paid:    'bg-emerald-50 border-l-[3px] border-l-emerald-500 text-emerald-800 rounded-r-sm',
  expired: 'bg-slate-50   border-l-[3px] border-l-slate-400   text-slate-600  rounded-r-sm',
  failed:  'bg-red-50     border-l-[3px] border-l-red-400     text-red-700    rounded-r-sm',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:          'bg-slate-50   border-l-[3px] border-l-slate-400   text-slate-700  rounded-r-sm',
  awaiting_payment: 'bg-amber-50   border-l-[3px] border-l-amber-400   text-amber-800  rounded-r-sm',
  paid:             'bg-emerald-50 border-l-[3px] border-l-emerald-500 text-emerald-800 rounded-r-sm',
  processing:       'bg-indigo-50  border-l-[3px] border-l-indigo-500  text-indigo-800 rounded-r-sm',
  shipped:          'bg-purple-50  border-l-[3px] border-l-purple-400  text-purple-800 rounded-r-sm',
  delivered:        'bg-slate-50   border-l-[3px] border-l-slate-400   text-slate-700  rounded-r-sm',
  cancelled:        'bg-red-50     border-l-[3px] border-l-red-400     text-red-700    rounded-r-sm',
};

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmingKarunika, setConfirmingKarunika] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);
  const [pricingItem, setPricingItem] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

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

  function toggleExpand(orderId: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      return next;
    });
  }

  async function handleRequestStatus(orderId: string, itemId: string, status: 'approved' | 'rejected', unitPrice?: number) {
    const label = status === 'approved' ? 'Setujui' : 'Tolak';
    if (!confirm(`${label} item permintaan ini?`)) return;
    setUpdatingRequest(itemId);
    try {
      await api.admin.updateRequestItemStatus(orderId, itemId, status, unitPrice);
      setPricingItem(null);
      setPriceInput('');
      await fetchOrders();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUpdatingRequest(null);
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
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
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
                const requestItems = (order.order_items || []).filter(i => i.is_request);
                const pendingRequests = requestItems.filter(i => i.request_status === 'pending');
                const isExpanded = expanded.has(order.id);
                return (
                  <React.Fragment key={order.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      <div>{order.order_number}</div>
                      {requestItems.length > 0 && (
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className={`mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                            pendingRequests.length > 0
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {pendingRequests.length > 0 ? `${pendingRequests.length} permintaan pending` : `${requestItems.length} permintaan`} {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 font-medium">{order.shipping_name}</p>
                      <p className="text-slate-400 text-xs">{order.shipping_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      {formatIDR(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 ${ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700 rounded-r-sm'}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment ? (
                        <span className={`text-xs font-medium px-2 py-1 ${PAYMENT_STATUS_COLORS[payment.status] || 'bg-slate-100 text-slate-500 rounded-r-sm'}`}>
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
                            disabled={busy || pendingRequests.length > 0}
                            title={pendingRequests.length > 0 ? 'Selesaikan permintaan terlebih dahulu' : undefined}
                            className="bg-amber-500 text-white text-xs px-3 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors font-semibold w-full active:scale-[0.98]"
                          >
                            {confirmingKarunika === order.id ? 'Memproses...' : 'Konfirmasi Karunika'}
                          </button>
                        )}
                        {canConfirmPayment && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            disabled={busy}
                            className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            {confirming === order.id ? 'Memproses...' : 'Konfirmasi Bayar'}
                          </button>
                        )}
                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'processing', 'Proses')}
                            disabled={busy}
                            className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Proses
                          </button>
                        )}
                        {(order.status === 'paid' || order.status === 'processing') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'shipped', 'Kirim')}
                            disabled={busy}
                            className="bg-purple-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Kirim
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'delivered', 'Terima')}
                            disabled={busy}
                            className="bg-slate-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Terima
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && requestItems.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-3 bg-amber-50/40">
                        <div className="border border-amber-100 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 text-xs font-semibold text-amber-700">Item Permintaan</div>
                          <div className="divide-y divide-amber-50">
                            {requestItems.map(item => {
                              const isZeroPrice = item.unit_price === 0;
                              return (
                              <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                                <div className="flex-1 min-w-0">
                                  <span className="font-mono text-slate-500 mr-1">{item.module_code}</span>
                                  <span className="text-slate-700">{item.module_name}</span>
                                  <span className="text-slate-400 ml-1">×{item.quantity}</span>
                                </div>
                                <span className="font-semibold text-slate-700 tabular-nums shrink-0">
                                  {isZeroPrice && item.request_status !== 'rejected'
                                    ? <span className="text-xs text-slate-400 italic font-normal">Harga menyusul</span>
                                    : formatIDR(item.subtotal)
                                  }
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.request_status === 'pending' ? (
                                    pricingItem === item.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-500">Rp</span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={priceInput}
                                          onChange={e => setPriceInput(e.target.value)}
                                          placeholder="Harga..."
                                          autoFocus
                                          className="w-24 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400 text-xs"
                                        />
                                        <button
                                          onClick={() => handleRequestStatus(order.id, item.id, 'approved', Number(priceInput))}
                                          disabled={!priceInput || Number(priceInput) <= 0 || updatingRequest === item.id}
                                          className="bg-emerald-600 text-white px-2 py-1 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold active:scale-[0.98]"
                                        >
                                          {updatingRequest === item.id ? '...' : 'OK'}
                                        </button>
                                        <button
                                          onClick={() => { setPricingItem(null); setPriceInput(''); }}
                                          className="text-slate-400 hover:text-slate-600 px-1"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => {
                                            if (isZeroPrice) {
                                              setPricingItem(item.id);
                                              setPriceInput('');
                                            } else {
                                              handleRequestStatus(order.id, item.id, 'approved');
                                            }
                                          }}
                                          disabled={updatingRequest === item.id}
                                          className="bg-emerald-600 text-white px-2 py-1 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-semibold active:scale-[0.98]"
                                        >
                                          {updatingRequest === item.id ? '...' : 'Setujui'}
                                        </button>
                                        <button
                                          onClick={() => handleRequestStatus(order.id, item.id, 'rejected')}
                                          disabled={updatingRequest === item.id}
                                          className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors font-semibold active:scale-[0.98]"
                                        >
                                          {updatingRequest === item.id ? '...' : 'Tolak'}
                                        </button>
                                      </>
                                    )
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                      item.request_status === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-600'
                                    }`}>
                                      {item.request_status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
