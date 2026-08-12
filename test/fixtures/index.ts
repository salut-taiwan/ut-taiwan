/**
 * Typed factories mirroring types/index.ts.
 *
 * Every factory returns a *complete, plausible* DTO including the `_display`
 * and `*_display` fields the backend computes — the pages render those
 * directly, so a fixture that omits them tests a shape the backend never
 * sends.
 */

import type {
  CartDTO,
  CartItemDTO,
  FeeLine,
  ModuleSummaryDTO,
  OrderDTO,
  OrderItemDTO,
  PaymentDTO,
  ProductDTO,
  SksPaymentDTO,
  TotalBreakdown,
  UserProfileDTO,
} from '@/types';

export const idr = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
export const ntd = (n: number) => `NT$${n.toLocaleString('en-US')}`;

export const feeLine = (over: Partial<FeeLine> = {}): FeeLine => ({
  key: 'shipping',
  label: 'Ongkos kirim',
  amount: 300,
  amount_display: ntd(300),
  is_waived: false,
  ...over,
});

export const totalBreakdown = (over: Partial<TotalBreakdown> = {}): TotalBreakdown => ({
  subtotal_display: ntd(1700),
  fee_lines: [feeLine()],
  unique_code_display: null,
  total_display: ntd(2000),
  ...over,
});

export const moduleSummary = (over: Partial<ModuleSummaryDTO> = {}): ModuleSummaryDTO =>
  ({
    id: 'm-1',
    tbo_code: 'MKDU4109',
    name: 'Bahasa Inggris I',
    cover_image_url: null,
    price_student: 1700,
    is_available: true,
    price_student_display: ntd(1700),
    ...over,
  }) as ModuleSummaryDTO;

export const cartItem = (over: Partial<CartItemDTO> = {}): CartItemDTO => ({
  id: 'ci-1',
  itemType: 'module',
  moduleId: 'm-1',
  tboCode: 'MKDU4109',
  moduleName: 'Bahasa Inggris I',
  coverImageUrl: null,
  quantity: 1,
  priceSnapshot: 1700,
  subtotal: 1700,
  isAvailable: true,
  isRequest: false,
  isStale: false,
  isPricePending: false,
  priceSnapshotDisplay: ntd(1700),
  subtotalDisplay: ntd(1700),
  ...over,
});

export const cart = (over: Partial<CartDTO> = {}): CartDTO => ({
  id: 'c-1',
  userId: 'u-1',
  items: [cartItem()],
  subtotal: 1700,
  itemCount: 1,
  hasStaleItems: false,
  subtotal_display: ntd(1700),
  total_breakdown: totalBreakdown(),
  ...over,
});

export const emptyCart = (): CartDTO =>
  cart({ items: [], subtotal: 0, itemCount: 0, subtotal_display: ntd(0) });

export const orderItem = (over: Partial<OrderItemDTO> = {}): OrderItemDTO => ({
  id: 'oi-1',
  item_type: 'module',
  module_code: 'MKDU4109',
  module_name: 'Bahasa Inggris I',
  quantity: 1,
  unit_price: 1700,
  subtotal: 1700,
  is_request: false,
  request_status: null,
  display_status: 'normal',
  unit_price_display: ntd(1700),
  subtotal_display: ntd(1700),
  price_visible: true,
  ...over,
});

export const payment = (over: Partial<PaymentDTO> = {}): PaymentDTO => ({
  id: 'p-1',
  gateway: 'manual',
  method: 'bank_transfer',
  bank: 'BCA',
  amount: 2000,
  status: 'pending',
  paid_at: null,
  expires_at: null,
  show_payment_instructions: true,
  show_payment_deadline: false,
  proof_path: null,
  invoice_path: null,
  proof_uploaded_at: null,
  payment_status_label: 'Menunggu Pembayaran',
  amount_display: ntd(2000),
  ...over,
});

export const order = (over: Partial<OrderDTO> = {}): OrderDTO => ({
  id: 'o-1',
  order_number: 'UT-2026-0001',
  status: 'awaiting_payment',
  subtotal: 1700,
  shipping_cost: 300,
  box_fee: 0,
  admin_fee: 0,
  is_salut_order: false,
  total_amount: 2000,
  shipping_name: 'Budi Santoso',
  shipping_address: 'No 1, Sec 4, Roosevelt Rd',
  shipping_city: 'Taipei',
  shipping_province: 'Taipei',
  shipping_postal: '10617',
  shipping_country: 'Taiwan',
  shipping_phone: '+886912345678',
  notes: null,
  order_items: [orderItem()],
  payments: [payment()],
  created_at: '2026-05-20T06:30:00Z',
  order_kind: 'module',
  can_cancel: true,
  status_label: 'Menunggu Pembayaran',
  subtotal_display: ntd(1700),
  total_amount_display: ntd(2000),
  created_at_display: '20 Mei 2026',
  progress_percent: 25,
  steps: [
    { key: 'pending', label: 'Dibuat', state: 'completed' },
    { key: 'paid', label: 'Dibayar', state: 'current' },
  ],
  shipping_address_lines: ['Budi Santoso', 'No 1, Sec 4, Roosevelt Rd', 'Taipei 10617'],
  fee_lines: [feeLine()],
  total_breakdown: totalBreakdown(),
  ...over,
});

export const profile = (over: Partial<UserProfileDTO> = {}): UserProfileDTO =>
  ({
    id: 'u-1',
    email: 'budi@example.com',
    name: 'Budi Santoso',
    nim: '041234567',
    phone: '+886912345678',
    role: 'student',
    is_verified: true,
    is_salut: false,
    is_salut_active: false,
    salut_status: 'none',
    current_semester: 3,
    program_id: 'pr-1',
    // Registration requires the Mandarin address, so every real profile has
    // one — a fixture without it describes a shape the backend never sends.
    address_zh_city: '台北市',
    address_zh_district: '大安區',
    address_zh_road: '基隆路四段',
    address_zh_number: '43號',
    address_zh_floor: '',
    postal_code: '10617',
    country: 'Taiwan',
    birth_place: 'Jakarta',
    birth_date: '2000-01-01',
    shipping_address_lines: ['Budi Santoso', '台北市大安區基隆路四段43號', '10617'],
    ...over,
  }) as UserProfileDTO;

export const adminProfile = (over: Partial<UserProfileDTO> = {}) =>
  profile({ role: 'admin', name: 'Admin SALUT', ...over });

export const product = (over: Partial<ProductDTO> = {}): ProductDTO =>
  ({
    id: 'pr-1',
    tokopedia_id: 'tp-1',
    category: 'almet',
    name: 'Almamater UT',
    base_price: 560,
    weight_grams: 700,
    claim_rule: null,
    product_images: [{ id: 'i-1', image_url: 'https://cdn/almet.jpg', sort_order: 1 }],
    product_variant_types: [],
    product_skus: [],
    // The backend sends base_price_display, not a nested _display object.
    base_price_display: ntd(560),
    ...over,
  }) as ProductDTO;

export const sksPayment = (over: Partial<SksPaymentDTO> = {}): SksPaymentDTO =>
  ({
    id: 's-1',
    nim: '041234567',
    name: 'Budi Santoso',
    semester_period: '2026.1',
    idr_amount: 5600000,
    ntd_amount: 10000,
    rate_idr_per_ntd: 560,
    status: 'pending',
    rejection_reason: null,
    completed_at: null,
    created_at: '2026-05-20T00:00:00Z',
    status_label: 'Menunggu Verifikasi',
    status_tone: 'warning',
    idr_amount_display: idr(5600000),
    ntd_amount_display: ntd(10000),
    created_at_display: '20 Mei 2026',
    ...over,
  }) as SksPaymentDTO;

/** The three localStorage keys AuthProvider restores a session from. */
export function signIn(role: 'student' | 'admin' = 'student') {
  localStorage.setItem('ut_token', 'tok-1');
  localStorage.setItem('ut_refresh_token', 'ref-1');
  localStorage.setItem('ut_expires_at', String(Math.floor(Date.now() / 1000) + 3600));
  return role;
}
