'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';
import { OrderDTO } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-body)]',
  awaiting_payment: 'bg-amber-50  border border-amber-200  text-amber-700',
  paid:             'bg-emerald-50 border border-emerald-200 text-emerald-700',
  processing:       'bg-indigo-50  border border-indigo-200  text-indigo-700',
  shipped:          'bg-purple-50  border border-purple-200  text-purple-700',
  delivered:        'bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-body)]',
  cancelled:        'bg-red-50    border border-red-200    text-red-700',
};

const PAYMENT_COLORS: Record<string, string> = {
  paid:    'bg-emerald-50 border border-emerald-200 text-emerald-700',
  pending: 'bg-amber-50  border border-amber-200  text-amber-700',
  expired: 'bg-red-50    border border-red-200    text-red-700',
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ut_token');
    if (!token) { router.push('/login'); return; }
    api.orders.list().then(data => setOrders(data)).finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="max-w-3xl space-y-3">
      <div className="h-8 w-40 rounded skeleton mb-4" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-5 flex flex-col gap-3">
          <div className="flex justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-36 rounded skeleton" />
              <div className="h-3 w-24 rounded skeleton" />
            </div>
            <div className="h-6 w-20 rounded-full skeleton" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded skeleton" />
            <div className="h-4 w-24 rounded skeleton" />
          </div>
        </div>
      ))}
    </div>
  );

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 text-center py-20 max-w-xs mx-auto">
        <svg className="w-16 h-16 text-[var(--border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Belum ada pesanan</h2>
        <p className="text-sm text-[var(--text-muted)]">Anda belum pernah melakukan pemesanan</p>
        <Link href="/program"
          className="mt-2 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 hover:-translate-y-px transition-[background-color,transform,box-shadow] duration-150 font-semibold shadow-[var(--shadow-btn-primary)] hover:shadow-[var(--shadow-md)]">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Pesanan Saya</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <Link key={order.id} href={`/orders/${order.id}`}
            className="block bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-mono text-sm font-semibold text-[var(--foreground)]">{order.order_number}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(order.created_at)}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-body)]'}`}>
                {orderStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-[var(--text-body)]">
              <span>{order.order_items?.length || 0} modul</span>
              <div className="flex items-center gap-2">
                {order.payments?.[0] && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PAYMENT_COLORS[order.payments[0].status] || 'bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-body)]'}`}>
                    {paymentStatusLabel(order.payments[0].status)}
                  </span>
                )}
                <span className="font-semibold text-[var(--foreground)] tabular-nums">{formatIDR(order.payments?.[0]?.amount ?? order.total_amount)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
