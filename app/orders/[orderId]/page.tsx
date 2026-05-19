'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type FeesConfig } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';
import { OrderDTO, OrderItemDTO } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

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
  pending:          'bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-body)]',
  awaiting_payment: 'bg-amber-50  border border-amber-200  text-amber-700',
  paid:             'bg-emerald-50 border border-emerald-200 text-emerald-700',
  processing:       'bg-indigo-50  border border-indigo-200  text-indigo-700',
  shipped:          'bg-purple-50  border border-purple-200  text-purple-700',
  delivered:        'bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-body)]',
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

  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [fees, setFees] = useState<FeesConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    api.config.getFees().then(setFees).catch(() => {});
    api.orders.get(orderId).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  }, [authLoading, user, orderId, router]);

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
    setConfirming(true);
    setShowDeliveryConfirm(false);
    try {
      await api.orders.confirmDelivery(orderId);
      const updated = await api.orders.get(orderId);
      setOrder(updated);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setConfirming(false);
    }
  }

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    try {
      await api.payments.uploadProof(orderId, file);
      const updated = await api.orders.get(orderId);
      setOrder(updated);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setUploadingProof(false);
      e.target.value = '';
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setShowCancelConfirm(false);
    try {
      await api.orders.cancel(orderId);
      const updated = await api.orders.get(orderId);
      setOrder(updated);
    } catch (err) {
      showToast((err as Error).message, 'error');
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
  if (!order) return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <svg className="w-16 h-16 text-[var(--border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2 2 0 002-2V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75a2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Pesanan tidak ditemukan</h2>
      <Link href="/orders" className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
        Kembali ke Pesanan
      </Link>
    </div>
  );

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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{order.order_number}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{formatDate(order.created_at)}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-body)]'}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {/* Progress */}
      {order.status !== 'cancelled' && (
        <div className="mb-5 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
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
                  : 'bg-[var(--border)] text-[var(--text-muted)]'
                )}>
                  {isCompleted ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="text-xs text-[var(--text-body)] mt-1.5 text-center leading-tight hidden sm:block">
                  {STEP_LABELS[step] || orderStatusLabel(step)}
                </span>

              </div>
              );
            })}
          </div>
          <p className="text-xs text-center text-[var(--text-body)] mt-2 sm:hidden">
            {STEP_LABELS[ORDER_STEPS[stepIndex]] || orderStatusLabel(ORDER_STEPS[stepIndex])}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Payment info */}
        {payment && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
            <h2 className="font-semibold text-[var(--foreground)] mb-3">Informasi Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-body)]">Status</span>
                <span className="font-medium">{paymentStatusLabel(payment.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-body)]">Jumlah</span>
                <span className="font-bold tabular-nums">{formatIDR(payment.amount)}</span>
              </div>
              {payment.show_payment_deadline && payment.expires_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-body)]">Batas Bayar</span>
                  <span className="text-red-500 font-medium">{formatDate(payment.expires_at)}</span>
                </div>
              )}
              {payment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-body)]">Dibayar</span>
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
                    <span className="font-mono text-lg font-extrabold tracking-widest text-[var(--foreground)]">{payment.bank_account}</span>
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
                {payment.unique_code != null && payment.unique_code > 0 && (
                  <div className="flex justify-between text-xs text-blue-500 mt-0.5">
                    <span>Kode unik (sudah termasuk)</span>
                    <span className="font-mono font-semibold">+{formatIDR(payment.unique_code)}</span>
                  </div>
                )}
                {payment.expires_at && (
                  <p className="text-xs text-red-600 mt-1">
                    Batas pembayaran: {formatDate(payment.expires_at)}
                  </p>
                )}

                {/* QRIS */}
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-800 mb-2">Atau bayar via QRIS:</p>
                  <img src="/qris.png" alt="QRIS UT Taiwan" className="w-full rounded-xl border border-blue-200" />
                  <p className="text-xs text-[var(--text-body)] mt-1.5 text-center">
                    Scan dengan aplikasi bank atau e-wallet. Masukkan jumlah tepat termasuk kode unik.
                  </p>
                </div>

                {/* Bukti Bayar upload */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  {payment.proof_path ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-emerald-700 font-medium">Bukti transfer sudah dikirim</span>
                      <div className="ml-auto flex items-center gap-3">
                        <button
                          onClick={async () => {
                            try {
                              const url = await api.payments.viewProof(orderId);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 10000);
                            } catch (err) { showToast((err as Error).message, 'error'); }
                          }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Lihat
                        </button>
                        <label className="cursor-pointer text-xs text-[var(--text-muted)] hover:text-indigo-600 transition-colors">
                          {uploadingProof ? 'Mengupload...' : 'Ganti'}
                          <input type="file" accept="image/*,.pdf" className="sr-only" onChange={handleProofUpload} disabled={uploadingProof} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-blue-200 rounded-xl py-3 px-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-[border-color,background-color] duration-150">
                      {uploadingProof ? (
                        <>
                          <span className="border-2 border-blue-400 border-t-transparent rounded-full animate-spin w-4 h-4 shrink-0" />
                          <span className="text-sm text-blue-700">Mengupload...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="text-sm text-blue-700 font-medium">Upload Bukti Transfer</span>
                        </>
                      )}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} disabled={uploadingProof} />
                    </label>
                  )}
                </div>
              </div>
            )}
            {order.status === 'pending' && (
              <div className="mt-4 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] rounded-xl p-4 text-sm text-[var(--text-body)]">
                <p className="font-medium text-[var(--foreground)] mb-1">Menunggu verifikasi stok</p>
                <p>Pesanan Anda sedang diverifikasi stok oleh admin. Instruksi pembayaran akan dikirim melalui email setelah stok dikonfirmasi.</p>
              </div>
            )}
          </div>
        )}

        {/* Shipping info */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
          <h2 className="font-semibold text-[var(--foreground)] mb-3">Alamat Pengiriman</h2>
          <div className="text-sm text-[var(--text-body)] space-y-1">
            <p className="font-medium text-[var(--foreground)]">{order.shipping_name}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''}</p>
            <p>{order.shipping_postal} {order.shipping_country}</p>
            <p>{order.shipping_phone}</p>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="mb-4 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] p-5">
        <h2 className="font-semibold text-[var(--foreground)] mb-3">Daftar Modul</h2>
        <div className="space-y-0">
          <div className="flex items-center text-xs text-[var(--text-muted)] pb-2 border-b border-[var(--border-subtle)]">
            <span className="flex-1">Modul</span>
            <span className="w-24 text-right">Harga Satuan</span>
            <span className="w-24 text-right ml-4">Subtotal</span>
          </div>
          {order.order_items?.map((item: OrderItemDTO) => {
            const isRejected = item.display_status === 'rejected';
            const isPendingRequest = item.display_status === 'pending_request';
            const hidePrice = item.display_status === 'rejected' || item.display_status === 'zero_price';
            return (
              <div key={item.id} className={`flex items-center text-sm py-2.5 border-b border-[var(--border-subtle)] last:border-0 ${isRejected ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  {!item.sku_id && <span className="font-mono text-xs text-[var(--text-muted)] whitespace-nowrap">{item.module_code}</span>}
                  <span className={`truncate ${isRejected ? 'line-through text-[var(--text-muted)]' : 'text-[var(--foreground)]'}`}>{item.module_name}</span>
                  {item.variant_label && (
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">{item.variant_label}</span>
                  )}
                  {item.quantity > 1 && (
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">×{item.quantity}</span>
                  )}
                  {isRejected && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">Tidak Tersedia</span>
                  )}
                  {isPendingRequest && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">Menunggu</span>
                  )}
                </div>
                <span className="w-24 text-right tabular-nums text-[var(--text-body)]">
                  {hidePrice ? <span className="text-[var(--text-muted)]">-</span> : formatIDR(item.unit_price)}
                </span>
                <span className="w-24 text-right ml-4 font-medium tabular-nums">
                  {hidePrice ? <span className="text-[var(--text-muted)]">-</span> : <span className="text-[var(--foreground)]">{formatIDR(item.subtotal)}</span>}
                </span>
              </div>
            );
          })}
          <div className="pt-3 space-y-1.5 text-sm border-t border-[var(--border-subtle)]">
            <div className="flex justify-between text-[var(--text-body)]">
              <span>Subtotal Modul</span>
              <span className="tabular-nums">{formatIDR(order.subtotal)}</span>
            </div>
            {([
              { label: 'Ongkir',      field: order.shipping_cost, key: 'shipping' },
              { label: 'Biaya Box',   field: order.box_fee,       key: 'box'      },
              { label: 'Biaya Admin', field: order.admin_fee,     key: 'admin'    },
            ] as { label: string; field: number; key: string }[]).map(({ label, field, key }) => {
              const standardAmount = fees?.serviceFees.find(f => f.key === key)?.amount;
              return (
                <div key={label} className="flex justify-between text-[var(--text-body)] items-center">
                  <span>{label}</span>
                  {order.is_salut_order ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-[var(--text-muted)] line-through tabular-nums text-xs">{standardAmount != null ? formatIDR(standardAmount) : '...'}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">SALUT</span>
                    </span>
                  ) : (
                    <span className="tabular-nums">{formatIDR(field)}</span>
                  )}
                </div>
              );
            })}
            {payment?.unique_code != null && payment.unique_code > 0 && (
              <div className="flex justify-between text-[var(--text-body)]">
                <span>Kode Unik</span>
                <span className="tabular-nums">+{formatIDR(payment.unique_code)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[var(--foreground)] pt-2 border-t border-[var(--border-subtle)]">
              <span>Total</span>
              <span className="text-indigo-700 tabular-nums">{formatIDR(payment?.amount ?? order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery confirmation */}
      {order.confirm_deadline && (
        <div className="mb-4 bg-gradient-to-br from-purple-50 to-indigo-50/30 border border-purple-200 rounded-2xl p-6">
          <h2 className="font-semibold text-purple-900 text-base mb-1">Paket Sudah Sampai?</h2>
          <p className={`text-sm mb-5 ${order.confirm_deadline_is_urgent ? 'text-amber-700 font-medium' : 'text-purple-700'}`}>
            Konfirmasi penerimaan sebelum <strong>{formatDate(order.confirm_deadline)}</strong>
            {order.confirm_deadline_is_urgent && ' Segera konfirmasi!'}
          </p>
          {showDeliveryConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-purple-800 bg-purple-100 rounded-xl px-4 py-3">
                Pastikan Anda telah menerima semua modul sebelum mengkonfirmasi.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDelivery}
                  disabled={confirming}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors duration-150"
                >
                  {confirming
                    ? <><span className="border-2 border-white border-t-transparent rounded-full animate-spin w-4 h-4" /> Mengkonfirmasi...</>
                    : 'Ya, Sudah Diterima'
                  }
                </button>
                <button
                  onClick={() => setShowDeliveryConfirm(false)}
                  disabled={confirming}
                  className="px-5 py-3 rounded-xl border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 disabled:opacity-50 transition-colors duration-150"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowDeliveryConfirm(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-px text-white font-semibold py-3.5 rounded-xl transition-[background-color,transform,box-shadow] duration-150 shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]"
              >
                Sudah Diterima
              </button>
              <p className="text-xs text-purple-500 mt-2 text-center">
                Klik tombol ini setelah Anda menerima semua modul yang dipesan.
              </p>
            </>
          )}
        </div>
      )}

      {order.can_cancel && (
        <div className="text-right">
          {showCancelConfirm ? (
            <div className="flex items-center justify-end gap-3">
              <span className="text-sm text-[var(--text-body)]">Batalkan pesanan ini?</span>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors duration-150 font-medium"
              >
                {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-md hover:bg-[var(--surface-sunken)] disabled:opacity-50 transition-colors duration-150"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition-[color,background-color] duration-150"
            >
              Batalkan Pesanan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-[var(--text-muted)]">Memuat...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
