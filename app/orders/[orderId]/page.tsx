'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';
import { OrderDTO, OrderItemDTO } from '@/types';
import { cn } from '@/lib/utils';

const ORDER_STEPS = ['pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered'];
const STEP_LABELS: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  awaiting_payment: 'Stok Dikonfirmasi',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Terkirim',
};
const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-slate-50  border border-slate-200  text-slate-600',
  awaiting_payment: 'bg-amber-50  border border-amber-200  text-amber-700',
  paid:             'bg-emerald-50 border border-emerald-200 text-emerald-700',
  processing:       'bg-indigo-50  border border-indigo-200  text-indigo-700',
  shipped:          'bg-purple-50  border border-purple-200  text-purple-700',
  delivered:        'bg-slate-50  border border-slate-200  text-slate-700',
  cancelled:        'bg-red-50    border border-red-200    text-red-700',
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function OrderDetailContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === '1';

  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { router.push('/login'); return; }
    api.orders.get(orderId).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  }, [orderId, router]);

  async function handleCopyAccount() {
    const payment = order?.payments?.[0];
    if (!payment?.bank_account) return;
    try {
      await navigator.clipboard.writeText(payment.bank_account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function handleConfirmDelivery() {
    if (!confirm('Konfirmasi penerimaan paket ini? Pastikan Anda telah menerima semua modul sebelum mengkonfirmasi.')) return;
    setConfirming(true);
    try {
      await api.orders.confirmDelivery(orderId);
      const updated = await api.orders.get(orderId);
      setOrder(updated);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Batalkan pesanan ini?')) return;
    setCancelling(true);
    try {
      await api.orders.cancel(orderId);
      const updated = await api.orders.get(orderId);
      setOrder(updated);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return (
    <div className="max-w-3xl space-y-4">
      <div className="h-4 w-28 rounded skeleton" />
      <div className="h-8 w-48 rounded skeleton" />
      <div className="h-24 rounded-2xl skeleton" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 rounded-2xl skeleton" />
        <div className="h-40 rounded-2xl skeleton" />
      </div>
      <div className="h-48 rounded-2xl skeleton" />
    </div>
  );
  if (!order) return <div className="text-center py-16 text-red-500">Pesanan tidak ditemukan</div>;

  const payment = order.payments?.[0];
  const stepIndex = order.step_index ?? ORDER_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors duration-150 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Semua Pesanan
      </Link>

      {isNew && (
        <div className="mb-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-800 text-sm animate-[slideDown_200ms_ease-out]">
          <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          Pesanan berhasil dibuat! Kami akan mengkonfirmasi stok dengan Karunika dan mengirimkan instruksi pembayaran melalui email.
        </div>
      )}

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.order_number}</h1>
          <p className="text-sm text-slate-400 mt-1">{formatDate(order.created_at)}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {/* Progress */}
      {order.status !== 'cancelled' && (
        <div className="mb-5 bg-white rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
          <div className="flex items-center justify-between relative">
            {/* Gradient connector */}
            <div
              className="absolute top-4 left-0 right-0 h-0.5 -z-0"
              style={{
                background: stepIndex > 0
                  ? `linear-gradient(to right, #0A4595 ${(stepIndex / (ORDER_STEPS.length - 1)) * 100}%, #E2E8F0 ${(stepIndex / (ORDER_STEPS.length - 1)) * 100}%)`
                  : '#E2E8F0',
              }}
            />
            {ORDER_STEPS.map((step, i) => {
              const isDelivered = order.status === 'delivered';
              const isCompleted = i < stepIndex || (i === stepIndex && isDelivered);
              const isCurrent   = i === stepIndex && !isDelivered;
              return (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10',
                  isCompleted ? 'bg-indigo-600 text-white'
                  : isCurrent ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                  : 'bg-slate-200 text-slate-400'
                )}>
                  {isCompleted ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="text-xs text-slate-500 mt-1.5 text-center leading-tight hidden sm:block">
                  {STEP_LABELS[step] || orderStatusLabel(step)}
                </span>
              </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Payment info */}
        {payment && (
          <div className="bg-white rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Informasi Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-medium">{paymentStatusLabel(payment.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah</span>
                <span className="font-bold tabular-nums">{formatIDR(payment.amount)}</span>
              </div>
              {payment.show_payment_deadline && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Batas Bayar</span>
                  <span className="text-red-500 font-medium">{formatDate(payment.expires_at)}</span>
                </div>
              )}
              {payment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Dibayar</span>
                  <span>{formatDate(payment.paid_at)}</span>
                </div>
              )}
            </div>

            {/* Payment instructions */}
            {payment.show_payment_instructions && (
              <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200 rounded-2xl p-5 text-sm text-blue-900 space-y-2">
                <p className="font-semibold mb-3">Harap transfer ke rekening {payment.bank_name}:</p>
                <div className="flex justify-between">
                  <span className="text-blue-700">Atas nama</span>
                  <span className="font-medium">{payment.bank_holder}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">No. Rekening</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-extrabold tracking-widest text-slate-900">{payment.bank_account}</span>
                    <button
                      onClick={handleCopyAccount}
                      title="Salin nomor rekening"
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded p-0.5 transition-[color,background-color] duration-150"
                    >
                      {copied ? (
                        <CheckIcon className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2 mt-1">
                  <span className="text-blue-700">Jumlah tepat</span>
                  <span className="font-bold text-blue-900 tabular-nums">{formatIDR(payment.amount)}</span>
                </div>
                {payment.expires_at && (
                  <p className="text-xs text-red-600 mt-1">
                    Batas pembayaran: {formatDate(payment.expires_at)}
                  </p>
                )}
              </div>
            )}
            {order.status === 'pending' && (
              <div className="mt-4 bg-slate-50 border border-[var(--border-subtle)] rounded-xl p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-700 mb-1">Menunggu verifikasi stok</p>
                <p>Pesanan Anda sedang diverifikasi stok oleh admin. Instruksi pembayaran akan dikirim melalui email setelah stok dikonfirmasi.</p>
              </div>
            )}
          </div>
        )}

        {/* Shipping info */}
        <div className="bg-white rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
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
      <div className="mb-4 bg-white rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Daftar Modul</h2>
        <div className="space-y-0">
          <div className="flex items-center text-xs text-slate-400 pb-2 border-b border-[var(--border-subtle)]">
            <span className="flex-1">Modul</span>
            <span className="w-24 text-right">Harga Satuan</span>
            <span className="w-24 text-right ml-4">Subtotal</span>
          </div>
          {order.order_items?.map((item: OrderItemDTO) => {
            const isRejected = item.display_status === 'rejected';
            const isPendingRequest = item.display_status === 'pending_request';
            const hidePrice = item.display_status === 'rejected' || item.display_status === 'zero_price';
            return (
              <div key={item.id} className={`flex items-center text-sm py-2.5 border-b border-slate-50 last:border-0 ${isRejected ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  <span className="font-mono text-xs text-slate-400 whitespace-nowrap">{item.module_code}</span>
                  <span className={`truncate ${isRejected ? 'line-through text-slate-400' : 'text-slate-900'}`}>{item.module_name}</span>
                  {item.quantity > 1 && (
                    <span className="text-xs text-slate-400 whitespace-nowrap">×{item.quantity}</span>
                  )}
                  {isRejected && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">Tidak Tersedia</span>
                  )}
                  {isPendingRequest && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">Menunggu</span>
                  )}
                </div>
                <span className="w-24 text-right tabular-nums text-slate-500">
                  {hidePrice ? <span className="text-slate-300">—</span> : formatIDR(item.unit_price)}
                </span>
                <span className="w-24 text-right ml-4 font-medium tabular-nums">
                  {hidePrice ? <span className="text-slate-300">—</span> : <span className="text-slate-900">{formatIDR(item.subtotal)}</span>}
                </span>
              </div>
            );
          })}
          <div className="pt-3 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span className="text-indigo-700 tabular-nums">{formatIDR(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery confirmation */}
      {order.confirm_deadline && (
        <div className="mb-4 bg-gradient-to-br from-purple-50 to-indigo-50/30 border border-purple-200 rounded-2xl p-6">
          <h2 className="font-semibold text-purple-900 text-base mb-1">Paket Sudah Sampai?</h2>
          <p className={`text-sm mb-5 ${order.confirm_deadline_is_urgent ? 'text-amber-700 font-medium' : 'text-purple-700'}`}>
            Konfirmasi penerimaan sebelum <strong>{formatDate(order.confirm_deadline)}</strong>
            {order.confirm_deadline_is_urgent && ' — segera konfirmasi!'}
          </p>
          <button
            onClick={handleConfirmDelivery}
            disabled={confirming}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-px disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
          >
            {confirming
              ? <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Mengkonfirmasi...</>
              : 'Sudah Diterima'
            }
          </button>
          <p className="text-xs text-purple-500 mt-2 text-center">
            Klik tombol ini setelah Anda menerima semua modul yang dipesan.
          </p>
        </div>
      )}

      {order.can_cancel && (
        <div className="text-right">
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md disabled:opacity-40 transition-[color,background-color] duration-150"
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
