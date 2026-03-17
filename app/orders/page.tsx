'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatIDR, formatDate, orderStatusLabel, paymentStatusLabel } from '@/lib/utils';
import { OrderDTO } from '@/types';


const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
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

  if (loading) return <div className="text-center py-16 text-slate-400">Memuat pesanan...</div>;

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Belum ada pesanan</h2>
        <p className="text-slate-500 mb-6">Anda belum pernah melakukan pemesanan</p>
        <Link href="/program" className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-sm">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Pesanan Saya</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <Link key={order.id} href={`/orders/${order.id}`}
            className="block bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-mono text-sm font-semibold text-slate-900">{order.order_number}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(order.created_at)}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'}`}>
                {orderStatusLabel(order.status)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{order.order_items?.length || 0} modul</span>
              <div className="flex items-center gap-2">
                {order.payments?.[0] && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    order.payments[0].status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.payments[0].status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {paymentStatusLabel(order.payments[0].status)}
                  </span>
                )}
                <span className="font-semibold text-slate-900">{formatIDR(order.total_amount)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
