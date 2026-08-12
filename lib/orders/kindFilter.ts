export type OrderKind = 'module' | 'merch' | 'mixed';
export type OrderKindTab = 'all' | 'module' | 'merch';

interface OrderLike {
  order_kind?: OrderKind;
}

/**
 * Filter the admin order list by what an order contains.
 *
 * An order holding both kinds appears under *both* work queues: the modules
 * team and the merchandise team each need to see it, and hiding it from either
 * would strand the order.
 */
export function filterOrdersByKind<T extends OrderLike>(orders: T[], tab: OrderKindTab): T[] {
  if (tab === 'all') return orders;
  return orders.filter(o => o.order_kind === tab || o.order_kind === 'mixed');
}
