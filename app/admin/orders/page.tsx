'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { OrderDTO, OrderItemDTO } from '@/types';
import { filterOrdersByKind, type OrderKindTab } from '@/lib/orders/kindFilter';

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50   border-l-[3px] border-l-amber-400   text-amber-800  rounded-r-sm',
  paid:    'bg-emerald-50 border-l-[3px] border-l-emerald-500 text-emerald-800 rounded-r-sm',
  expired: 'bg-[var(--surface-sunken)] border-l-[3px] border-l-[var(--border-default)] text-[var(--text-body)] rounded-r-sm',
  failed:  'bg-red-50     border-l-[3px] border-l-red-400     text-red-700    rounded-r-sm',
};

// Almet and modul are handled by different people on different timelines, so the
// table is filtered by what an order contains. A mixed order shows under both.
type KindTab = OrderKindTab;

const KIND_TAB_LABELS: Record<KindTab, string> = {
  all: 'Semua',
  module: 'Modul',
  merch: 'Almet & Merch',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:          'bg-[var(--surface-sunken)] border-l-[3px] border-l-[var(--border-default)] text-[var(--text-body)] rounded-r-sm',
  awaiting_payment: 'bg-amber-50   border-l-[3px] border-l-amber-400   text-amber-800  rounded-r-sm',
  paid:             'bg-emerald-50 border-l-[3px] border-l-emerald-500 text-emerald-800 rounded-r-sm',
  processing:       'bg-indigo-50  border-l-[3px] border-l-indigo-500  text-indigo-800 rounded-r-sm',
  shipped:          'bg-purple-50  border-l-[3px] border-l-purple-400  text-purple-800 rounded-r-sm',
  delivered:        'bg-[var(--surface-sunken)] border-l-[3px] border-l-[var(--border-default)] text-[var(--text-body)] rounded-r-sm',
  cancelled:        'bg-red-50     border-l-[3px] border-l-red-400     text-red-700    rounded-r-sm',
};

// Merch lines reuse the module_* columns, so module_code is blank for them —
// show what the item actually is instead of an empty monospace gap.
function ItemLabel({ item }: { item: OrderItemDTO }) {
  return (
    <div className="flex-1 min-w-0">
      {item.item_type === 'merch' ? (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 mr-1">Almet</span>
      ) : (
        <span className="font-mono text-[var(--text-muted)] mr-1">{item.module_code}</span>
      )}
      <span className="text-[var(--text-body)]">{item.module_name}</span>
      {item.variant_label && <span className="text-[var(--text-muted)] ml-1">({item.variant_label})</span>}
      <span className="text-[var(--text-muted)] ml-1">×{item.quantity}</span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [confirmingKarunika, setConfirmingKarunika] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);
  const [pricingItem, setPricingItem] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [kindTab, setKindTab] = useState<KindTab>('all');

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
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function updateOrderInState(orderId: string, patch: Partial<OrderDTO> | ((order: OrderDTO) => OrderDTO)) {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      return typeof patch === 'function' ? patch(o) : { ...o, ...patch };
    }));
  }

  async function handleStatusUpdate(orderId: string, newStatus: string, label: string) {
    if (!confirm(`${label} pesanan ini?`)) return;
    setUpdatingStatus(orderId);
    try {
      await api.admin.updateOrderStatus(orderId, newStatus);
      updateOrderInState(orderId, { status: newStatus as OrderDTO['status'] });
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleConfirmKarunika(orderId: string) {
    if (!confirm('Konfirmasi stok Karunika tersedia? Email instruksi pembayaran akan dikirim ke pelanggan.')) return;
    setConfirmingKarunika(orderId);
    try {
      await api.admin.confirmKarunika(orderId);
      updateOrderInState(orderId, { status: 'awaiting_payment' });
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setConfirmingKarunika(null);
    }
  }

  async function handleConfirm(orderId: string) {
    if (!confirm('Konfirmasi pembayaran pesanan ini?')) return;
    setConfirming(orderId);
    try {
      await api.admin.confirmPayment(orderId);
      updateOrderInState(orderId, (order) => ({
        ...order,
        status: 'paid',
        payments: (order.payments ?? []).map((p, i) =>
          i === 0 ? { ...p, status: 'paid' as const } : p
        ),
      }));
      showToast('Pembayaran dikonfirmasi');
    } catch (err) {
      showToast((err as Error).message, 'error');
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

  async function handleInvoiceUpload(orderId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.admin.uploadInvoice(orderId, file);
      updateOrderInState(orderId, (order) => ({
        ...order,
        payments: (order.payments ?? []).map((p, i) =>
          i === 0 ? { ...p, invoice_path: p.invoice_path ?? '__uploaded__' } : p
        ),
      }));
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      e.target.value = '';
    }
  }

  async function handleRequestStatus(orderId: string, itemId: string, status: 'approved' | 'rejected', unitPrice?: number) {
    const label = status === 'approved' ? 'Setujui' : 'Tolak';
    if (!confirm(`${label} item ini?`)) return;
    setUpdatingRequest(itemId);
    try {
      const res = await api.admin.updateRequestItemStatus(orderId, itemId, status, unitPrice);
      setPricingItem(null);
      setPriceInput('');
      // Resolving an item rewrites the order subtotal, total and payment amount
      // server-side, so take the whole order back rather than patching the row.
      if (res.order) updateOrderInState(orderId, () => res.order!);
      else await fetchOrders();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUpdatingRequest(null);
    }
  }

  if (isLoading || loading) return <div className="text-center py-16 text-[var(--text-muted)]">Memuat...</div>;
  if (!user || user.role !== 'admin') return null;

  const visibleOrders = filterOrdersByKind(orders, kindTab);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Panel Admin</span>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mt-1">Pesanan & Pembayaran</h1>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
        >
          Refresh
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Filter jenis pesanan"
        className="flex gap-1 bg-[var(--surface-sunken)] rounded-lg p-1 mb-5 w-fit"
      >
        {(Object.keys(KIND_TAB_LABELS) as KindTab[]).map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={kindTab === t}
            onClick={() => setKindTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              kindTab === t
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {KIND_TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          {orders.length === 0 ? 'Belum ada pesanan' : 'Tidak ada pesanan pada kategori ini'}
        </div>
      ) : (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-sunken)] text-[var(--text-muted)] text-xs uppercase tracking-wide">
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
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {visibleOrders.map(order => {
                const payment = order.payments?.[0];
                const canConfirmKarunika = order.status === 'pending';
                const canConfirmPayment = order.status === 'awaiting_payment' && payment?.status === 'pending';
                const busy = confirming === order.id || confirmingKarunika === order.id || updatingStatus === order.id;
                const requestItems = (order.order_items || []).filter(i => i.is_request);
                const availableItems = (order.order_items || []).filter(i => !i.is_request);
                const pendingRequests = requestItems.filter(i => i.request_status === 'pending');
                const isExpanded = expanded.has(order.id);
                return (
                  <React.Fragment key={order.id}>
                  <tr className="hover:bg-[var(--surface-sunken)] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--foreground)]">
                      <div className="flex items-center gap-1.5">
                        {order.order_number}
                        {order.is_salut_order && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-sans">SALUT</span>
                        )}
                        {order.order_kind === 'mixed' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-sans">Campuran</span>
                        )}
                        {order.order_kind === 'merch' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-sans">Almet</span>
                        )}
                      </div>
                      {(order.order_items && order.order_items.length > 0) && (
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className={`mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                            pendingRequests.length > 0
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : requestItems.length > 0
                              ? 'bg-[var(--surface-sunken)] text-[var(--text-body)] hover:bg-[var(--border-subtle)]'
                              : order.status === 'awaiting_payment'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-[var(--surface-sunken)] text-[var(--text-body)] hover:bg-[var(--border-subtle)]'
                          }`}
                        >
                          {pendingRequests.length > 0
                            ? `${pendingRequests.length} permintaan pending`
                            : requestItems.length > 0
                            ? `${requestItems.length} permintaan`
                            : order.status === 'awaiting_payment'
                            ? 'Dokumen'
                            : 'Detail Item'
                          } {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--foreground)] font-medium">{order.shipping_name}</p>
                      <p className="text-[var(--text-muted)] text-xs">{order.shipping_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--foreground)] tabular-nums">
                      {payment?.amount_display ?? order.total_amount_display}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 ${ORDER_STATUS_COLORS[order.status] || 'bg-[var(--surface-sunken)] text-[var(--text-body)] rounded-r-sm'}`}>
                        {order.status_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payment ? (
                        <span className={`text-xs font-medium px-2 py-1 ${PAYMENT_STATUS_COLORS[payment.status] || 'bg-[var(--surface-sunken)] text-[var(--text-muted)] rounded-r-sm'}`}>
                          {payment.payment_status_label}
                        </span>
                      ) : (
                        <span className="text-[var(--border-default)] text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-body)] text-xs">{order.created_at_display}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        {canConfirmKarunika && (
                          <button
                            onClick={() => handleConfirmKarunika(order.id)}
                            disabled={busy || pendingRequests.length > 0}
                            title={pendingRequests.length > 0 ? 'Selesaikan permintaan terlebih dahulu' : undefined}
                            className="bg-amber-500 text-slate-900 text-xs px-3 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors font-semibold w-full active:scale-[0.98]"
                          >
                            {confirmingKarunika === order.id ? 'Memproses...' : 'Konfirmasi Karunika'}
                          </button>
                        )}
                        {canConfirmPayment && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            disabled={busy}
                            className="bg-emerald-600 text-slate-900 text-xs px-3 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            {confirming === order.id ? 'Memproses...' : 'Konfirmasi Bayar'}
                          </button>
                        )}
                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'processing', 'Proses')}
                            disabled={busy}
                            className="bg-indigo-600 text-slate-900 text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Proses
                          </button>
                        )}
                        {(order.status === 'paid' || order.status === 'processing') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'shipped', 'Kirim')}
                            disabled={busy}
                            className="bg-purple-600 text-slate-900 text-xs px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Kirim
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'delivered', 'Terima')}
                            disabled={busy}
                            className="bg-[var(--surface-sunken)] text-[var(--foreground)] border border-[var(--border-strong)] text-xs px-3 py-2 rounded-lg hover:bg-[var(--border-subtle)] disabled:opacity-50 transition-colors font-semibold w-full"
                          >
                            Terima
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && order.status === 'awaiting_payment' && payment && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-2 pt-0 bg-blue-50/40">
                        <div className="border border-blue-100 rounded-xl px-4 py-3 mt-1.5 text-xs space-y-1">
                          <p className="font-semibold text-[var(--text-body)] mb-2">Rincian Biaya</p>
                          <div className="flex justify-between text-[var(--text-body)]">
                            <span>Subtotal Item</span>
                            <span className="tabular-nums">{order.subtotal_display}</span>
                          </div>
                          {order.fee_lines?.map((line) => (
                            <div key={line.key} className="flex justify-between text-[var(--text-body)] items-center">
                              <span>{line.label}</span>
                              {line.is_waived ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="text-[var(--text-muted)] line-through tabular-nums">{line.original_amount_display}</span>
                                  <span className="text-[10px] font-semibold px-1 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">SALUT</span>
                                </span>
                              ) : (
                                <span className="tabular-nums">{line.amount_display}</span>
                              )}
                            </div>
                          ))}
                          <div className="flex justify-between font-bold pt-1 border-t border-[var(--border-subtle)]">
                            <span>Total</span>
                            <span className="tabular-nums">{payment.amount_display}</span>
                          </div>
                        </div>
                        <div className="flex gap-6 text-xs py-2 border border-blue-100 rounded-xl px-4 mt-2">
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--text-body)] mb-1">Bukti Bayar Pembeli</p>
                            {payment.proof_path ? (
                              <button
                                onClick={async () => {
                                  try {
                                    const url = await api.payments.viewProof(order.id);
                                    window.open(url, '_blank');
                                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                                  } catch (err) { showToast((err as Error).message, 'error'); }
                                }}
                                className="text-blue-600 underline"
                              >
                                Lihat Bukti
                              </button>
                            ) : (
                              <span className="text-[var(--text-muted)] italic">Belum ada bukti</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--text-body)] mb-1">Invoice Karunika</p>
                            {payment.invoice_path ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      const url = await api.admin.viewInvoice(order.id);
                                      window.open(url, '_blank');
                                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                                    } catch (err) { showToast((err as Error).message, 'error'); }
                                  }}
                                  className="text-blue-600 underline"
                                >
                                  Lihat Invoice
                                </button>
                                <label className="text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-body)]">[Ganti]
                                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleInvoiceUpload(order.id, e)} />
                                </label>
                              </div>
                            ) : (
                              <label className="cursor-pointer text-indigo-600 hover:underline font-medium">
                                Upload Invoice
                                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleInvoiceUpload(order.id, e)} />
                              </label>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {isExpanded && availableItems.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 pb-1 pt-0 bg-slate-50/40">
                        <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-body)]">Item Tersedia</div>
                          <div className="divide-y divide-[var(--border-subtle)]">
                            {availableItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                                <ItemLabel item={item} />
                                <span className={`tabular-nums shrink-0 ${item.request_status === 'rejected' ? 'text-[var(--text-muted)] line-through' : 'font-semibold text-[var(--text-body)]'}`}>
                                  {item.subtotal_display}
                                </span>
                                <div className="shrink-0">
                                  {item.request_status === 'rejected' ? (
                                    <span className="px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-600">Ditolak</span>
                                  ) : (
                                    <button
                                      onClick={() => handleRequestStatus(order.id, item.id, 'rejected')}
                                      disabled={updatingRequest === item.id}
                                      className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold active:scale-[0.98]"
                                    >
                                      {updatingRequest === item.id ? '...' : 'Tolak'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
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
                                <ItemLabel item={item} />
                                <span className="font-semibold text-[var(--text-body)] tabular-nums shrink-0">
                                  {isZeroPrice && item.request_status !== 'rejected'
                                    ? <span className="text-xs text-[var(--text-muted)] italic font-normal">Harga menyusul</span>
                                    : item.subtotal_display
                                  }
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.request_status === 'pending' ? (
                                    pricingItem === item.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[var(--text-body)]">Rp</span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={priceInput}
                                          onChange={e => setPriceInput(e.target.value)}
                                          placeholder="Harga..."
                                          autoFocus
                                          className="w-24 border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400 text-xs"
                                        />
                                        <button
                                          onClick={() => handleRequestStatus(order.id, item.id, 'approved', Number(priceInput))}
                                          disabled={!priceInput || Number(priceInput) <= 0 || updatingRequest === item.id}
                                          className="bg-emerald-700 text-white px-2 py-1 rounded-lg hover:bg-emerald-800 disabled:opacity-50 font-semibold active:scale-[0.98]"
                                        >
                                          {updatingRequest === item.id ? '...' : 'OK'}
                                        </button>
                                        <button
                                          onClick={() => { setPricingItem(null); setPriceInput(''); }}
                                          className="text-[var(--text-muted)] hover:text-[var(--text-body)] px-1"
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
                                          className="bg-emerald-700 text-white px-2 py-1 rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition-colors font-semibold active:scale-[0.98]"
                                        >
                                          {updatingRequest === item.id ? '...' : 'Setujui'}
                                        </button>
                                        <button
                                          onClick={() => handleRequestStatus(order.id, item.id, 'rejected')}
                                          disabled={updatingRequest === item.id}
                                          className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold active:scale-[0.98]"
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
