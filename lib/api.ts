import type {
  AdminSalutApplicationDTO,
  AdminSksPaymentDTO,
  AdminUserDTO,
  AdminUserListResponseDTO,
  CartDTO,
  FacultyDTO,
  ModuleDTO,
  ModuleSummaryDTO,
  OrderDTO,
  PackageDTO,
  PackageListResponseDTO,
  ClaimCta,
  ProductDTO,
  ProductListResponseDTO,
  ProgramDTO,
  ScraperRunDTO,
  SksPaymentDTO,
  SksPaymentQuoteDTO,
  SubjectDTO,
  UserProfileDTO,
} from '@/types';

export interface RenewalPolicy {
  resetMonth: number;
  resetDay: number;
  resetDates?: { month: number; day: number }[];
  timezone: string;
  notice: string;
  next_renewal_date_display?: string | null;
}

export interface FeesConfig {
  salutMembership: {
    currency: 'NTD';
    new: number;
    returning: number;
    rule: string;
    renewalPolicy: RenewalPolicy;
    // Backend-formatted strings (Phase 1 additive fields)
    new_display?: string;
    returning_display?: string;
    new_label?: string;
    returning_label?: string;
    tier_combined_display?: string;
    // IDR equivalents — the fee is quoted in NTD but transferred via QRIS in IDR.
    new_display_idr?: string | null;
    returning_display_idr?: string | null;
    tier_combined_display_idr?: string;
  };
  serviceFees: { label: string; key: string; amount: number; amount_display?: string }[];
  totalServiceFees: number;
  totalServiceFees_display?: string;
  serviceFeesCurrency: 'IDR';
  paymentBank: {
    bank: string;
    account: string;
    holder: string;
  };
  sksPayment?: {
    rate_label?: string;
    payment_bank?: {
      bank: string;
      account: string;
      bank_code: string;
      swift_code: string;
      holder: string;
      currency: 'NTD';
    };
  };
}

export interface ChatWidgetConfig {
  greeting: {
    enabled: boolean;
    text: string;
    showDelayMs: number;
    autoHideMs: number;
  };
}

export type EffectiveSalutStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApplicableFee {
  amount: number;
  currency: 'NTD';
  tier: 'new' | 'returning';
  amount_display: string;
  amount_idr?: number;
  amount_idr_display?: string | null;
  tier_label: string;
}

export interface SalutStatus {
  is_salut: boolean;
  is_salut_active: boolean;
  salut_status: string;
  salut_applied_at: string | null;
  salut_rejection_reason: string | null;
  salut_approved_at: string | null;
  salut_applied_fee_amount: string | null;
  salut_applied_semester: number | null;
  renewalPolicy: RenewalPolicy;
  // Backend-derived fields (Phase 1 additive)
  effective_status?: EffectiveSalutStatus;
  is_member?: boolean;
  is_pending?: boolean;
  applicable_fee?: ApplicableFee | null;
  salut_applied_at_display?: string | null;
  salut_approved_at_display?: string | null;
  salut_applied_fee_amount_display?: string | null;
}

export interface BankOption {
  code: string;
  name: string;
  display_label: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ut_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ut_refresh_token');
}

export function getExpiresAt(): number | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem('ut_expires_at');
  return v ? Number(v) : null;
}

// Callback set by AuthContext to signal that the session is fully expired
export let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(cb: (() => void) | null) {
  onSessionExpired = cb;
}

// The in-flight refresh, shared by every request that 401s while it runs.
// This used to be a boolean, so a second concurrent 401 skipped the refresh and
// threw "Sesi berakhir" even though the session had just been renewed.
let refreshInFlight: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= attemptRefresh().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('ut_token', data.token);
    localStorage.setItem('ut_refresh_token', data.refreshToken);
    localStorage.setItem('ut_expires_at', String(data.expiresAt));
    // Notify auth context about the new expiresAt so it can reschedule timers
    window.dispatchEvent(new CustomEvent('ut:token-refreshed', { detail: { expiresAt: data.expiresAt } }));
    return true;
  } catch {
    return false;
  }
}

/**
 * fetch for multipart uploads and binary downloads, which cannot go through
 * apiFetch because it forces a JSON content type and parses the response.
 *
 * It still has to share apiFetch's 401 handling: without it, a token that
 * expired mid-session made every upload fail with a bare "Upload gagal" and no
 * session-expiry prompt, even though a refresh would have succeeded.
 */
async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const withAuth = (token: string | null): RequestInit => ({
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, withAuth(token));
  if (res.status !== 401 || !token) return res;

  const refreshed = await refreshOnce();
  if (refreshed) return fetch(`${API_BASE}${path}`, withAuth(getToken()));

  onSessionExpired?.();
  throw new Error('Sesi berakhir. Silakan login kembali.');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (!token) {
      // No active session - treat as a regular API error (e.g., wrong credentials)
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    // Every concurrent 401 awaits the same refresh and then retries, rather
    // than the first one refreshing and the rest reporting a dead session.
    const refreshed = await refreshOnce();

    if (refreshed) {
      const newToken = getToken();
      const retryHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        ...(options.headers || {}),
      };
      const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders });
      if (retryRes.ok) return retryRes.json();

      // The token is fine; this particular request failed. Report its own
      // error instead of blaming the session.
      const retryErr = await retryRes.json().catch(() => ({ error: retryRes.statusText }));
      throw new Error(retryErr.error || `HTTP ${retryRes.status}`);
    }

    onSessionExpired?.();
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const api = {
  auth: {
    register: (body: {
      email: string; password: string; name: string; nim?: string; phone?: string;
      birth_place?: string; birth_date?: string;
      program_id: string;
      current_semester: number;
      address_zh_city: string; address_zh_district: string; address_zh_road: string;
      address_zh_number: string; address_zh_floor?: string;
      postal_code?: string;
      bank_ntd_code?: string; bank_ntd_name?: string; bank_ntd_account?: string;
      bank_idr_name?: string; bank_idr_account?: string;
    }) =>
      apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      apiFetch<{ token: string; refreshToken: string; expiresAt: number; user: { id: string; email: string } }>(
        '/auth/login', { method: 'POST', body: JSON.stringify(body) }
      ),
    refresh: (body: { refreshToken: string }) =>
      apiFetch<{ token: string; refreshToken: string; expiresAt: number }>(
        '/auth/refresh', { method: 'POST', body: JSON.stringify(body) }
      ),
    logout: () => apiFetch('/auth/logout', { method: 'POST' }),
    resendVerification: (email: string) =>
      apiFetch<{ message: string }>('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
    getMe: () => apiFetch<UserProfileDTO>('/auth/me'),
    updateMe: (body: Record<string, unknown>) =>
      apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  },
  catalog: {
    getFaculties: () => apiFetch<FacultyDTO[]>('/catalog/faculties'),
    getProgramsByFaculty: (facultyId: string) =>
      apiFetch<ProgramDTO[]>(`/catalog/faculties/${facultyId}/programs`),
    getPrograms: (facultyId?: string, facultyCode?: string) => {
      const qs = new URLSearchParams();
      if (facultyId) qs.set('facultyId', facultyId);
      if (facultyCode) qs.set('facultyCode', facultyCode);
      const q = qs.toString();
      return apiFetch<ProgramDTO[]>(`/catalog/programs${q ? '?' + q : ''}`);
    },
    getProgram: (id: string) => apiFetch<ProgramDTO>(`/catalog/programs/${id}`),
    getSubjects: (programId: string, semester?: number) =>
      apiFetch<SubjectDTO[]>(`/catalog/programs/${programId}/subjects${semester ? `?semester=${semester}` : ''}`),
    getSubject: (id: string) => apiFetch<SubjectDTO>(`/catalog/subjects/${id}`),
  },
  modules: {
    list: (page = 1, limit = 20) =>
      apiFetch<{ data: ModuleSummaryDTO[]; total: number }>(`/modules?page=${page}&limit=${limit}`),
    search: (q: string) => apiFetch<ModuleSummaryDTO[]>(`/modules/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => apiFetch<ModuleDTO>(`/modules/${id}`),
    create: (body: object) => apiFetch('/modules', { method: 'POST', body: JSON.stringify(body) }),
  },
  packages: {
    list: (
      params?: { programId?: string; semester?: string; search?: string; limit?: string; offset?: string },
      signal?: AbortSignal,
    ) => {
      const qs = params
        ? new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
          ).toString()
        : '';
      return apiFetch<PackageListResponseDTO>(`/packages${qs ? '?' + qs : ''}`, { signal });
    },
    get: (id: string) => apiFetch<PackageDTO>(`/packages/${id}`),
    sync: () => apiFetch<{ linked: number; packages: number }>('/packages/sync', { method: 'POST' }),
  },
  cart: {
    get: () => apiFetch<CartDTO>('/cart'),
    addItem: (moduleId: string, quantity = 1) =>
      apiFetch<CartDTO>('/cart/items', { method: 'POST', body: JSON.stringify({ moduleId, quantity }) }),
    addPackage: (packageId: string) =>
      apiFetch<CartDTO>('/cart/packages', { method: 'POST', body: JSON.stringify({ packageId }) }),
    addMerch: (skuId: string, quantity = 1) =>
      apiFetch<CartDTO>('/cart/merch', { method: 'POST', body: JSON.stringify({ skuId, quantity }) }),
    updateItem: (itemId: string, quantity: number) =>
      apiFetch<CartDTO>(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    convertToRequest: (itemId: string) =>
      apiFetch<CartDTO>(`/cart/items/${itemId}/convert-to-request`, { method: 'PATCH' }),
    removeItem: (itemId: string) =>
      apiFetch<CartDTO>(`/cart/items/${itemId}`, { method: 'DELETE' }),
    clear: () => apiFetch('/cart', { method: 'DELETE' }),
  },
  orders: {
    checkout: (body: object) =>
      apiFetch<{ order: OrderDTO }>('/orders/checkout', { method: 'POST', body: JSON.stringify(body) }),
    list: () => apiFetch<OrderDTO[]>('/orders'),
    get: (id: string) => apiFetch<OrderDTO>(`/orders/${id}`),
    cancel: (id: string) => apiFetch(`/orders/${id}/cancel`, { method: 'POST' }),
    confirmDelivery: (id: string) => apiFetch(`/orders/${id}/confirm-delivery`, { method: 'POST' }),
  },
  payments: {
    getStatus: (orderId: string) => apiFetch(`/payments/${orderId}`),
    uploadProof: async (orderId: string, file: File): Promise<void> => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await authedFetch(`/payments/${orderId}/proof`, { method: 'POST', body: fd });
      if (!r.ok) { const e = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(e.error || 'Upload gagal'); }
    },
    viewProof: async (orderId: string): Promise<string> => {
      const res = await authedFetch(`/payments/${orderId}/proof`);
      if (!res.ok) throw new Error('Gagal memuat file');
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
  },
  salut: {
    uploadProof: async (file: File): Promise<{ url: string }> => {
      const fd = new FormData();
      fd.append('proof', file);
      const r = await authedFetch('/salut/upload-proof', { method: 'POST', body: fd });
      if (!r.ok) { const e = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(e.error || 'Upload gagal'); }
      return r.json();
    },
    apply: (proofUrl: string, currentSemester: number, waNumber: string): Promise<{ message: string; fee: { amount: number; currency: 'NTD'; tier: 'new' | 'returning' }; nextExpiry: string; renewalPolicy: RenewalPolicy }> =>
      apiFetch('/salut/apply', { method: 'POST', body: JSON.stringify({ proofUrl, current_semester: currentSemester, wa_number: waNumber }) }),
    getStatus: () => apiFetch<SalutStatus>('/salut/status'),
  },
  sksPayment: {
    quote: (idr_amount: number, signal?: AbortSignal) =>
      apiFetch<SksPaymentQuoteDTO>('/sks-payment/quote', {
        method: 'POST',
        body: JSON.stringify({ idr_amount }),
        signal,
      }),
    uploadSlip: async (file: File): Promise<{ url: string }> => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await authedFetch('/sks-payment/upload-slip', { method: 'POST', body: fd });
      if (!r.ok) { const e = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(e.error || 'Upload gagal'); }
      return r.json();
    },
    uploadProof: async (file: File): Promise<{ url: string }> => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await authedFetch('/sks-payment/upload-proof', { method: 'POST', body: fd });
      if (!r.ok) { const e = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(e.error || 'Upload gagal'); }
      return r.json();
    },
    submit: (body: {
      nim: string;
      name: string;
      semester_period: string;
      idr_amount: number;
      ut_slip_url: string;
      transfer_proof_url: string;
    }) => apiFetch<SksPaymentDTO>('/sks-payment', { method: 'POST', body: JSON.stringify(body) }),
    listMine: () => apiFetch<SksPaymentDTO[]>('/sks-payment/mine'),
  },
  products: {
    list: (
      params?: { category?: string; limit?: string; offset?: string },
      signal?: AbortSignal,
    ) => {
      const qs = params
        ? new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
          ).toString()
        : '';
      return apiFetch<ProductListResponseDTO>(`/products${qs ? '?' + qs : ''}`, { signal });
    },
    get: (id: string) => apiFetch<ProductDTO>(`/products/${id}`),
    getClaimCta: (id: string) =>
      apiFetch<{ claim_cta: ClaimCta | null }>(`/products/${id}/claim-cta`),
  },
  config: {
    getFees: () => apiFetch<FeesConfig>('/config/fees'),
    getBanks: (currency: 'NTD' | 'IDR') =>
      apiFetch<{ currency: string; banks: BankOption[] }>(`/config/banks?currency=${currency}`),
    getChatWidget: () => apiFetch<ChatWidgetConfig>('/config/chat-widget'),
  },
  scraper: {
    run: () => apiFetch<{ runId: string }>('/scraper/run', { method: 'POST' }),
    runPrefixes: () => apiFetch<{ runId: string }>('/scraper/run-prefixes', { method: 'POST' }),
    getRuns: () => apiFetch<ScraperRunDTO[]>('/scraper/runs'),
    getRun: (id: string) => apiFetch<ScraperRunDTO>(`/scraper/runs/${id}`),
  },
  admin: {
    listOrders: () => apiFetch<OrderDTO[]>('/orders/admin/all'),
    confirmPayment: (orderId: string) =>
      apiFetch(`/payments/${orderId}/confirm`, { method: 'POST' }),
    updateOrderStatus: (orderId: string, status: string) =>
      apiFetch(`/orders/admin/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    confirmKarunika: (orderId: string) =>
      apiFetch(`/orders/admin/${orderId}/confirm-karunika`, { method: 'POST' }),
    // Returns the whole refreshed order: approving an item rewrites the order
    // totals and the pending payment amount server-side.
    updateRequestItemStatus: (orderId: string, itemId: string, status: 'approved' | 'rejected', unitPrice?: number) =>
      apiFetch<{ message: string; status: string; order: OrderDTO | null }>(`/orders/admin/${orderId}/items/${itemId}/request-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ...(unitPrice !== undefined ? { unit_price: unitPrice } : {}) }),
      }),
    uploadInvoice: async (orderId: string, file: File): Promise<void> => {
      const fd = new FormData();
      fd.append('file', file);
      const r = await authedFetch(`/payments/${orderId}/invoice`, { method: 'POST', body: fd });
      if (!r.ok) { const e = (await r.json().catch(() => ({}))) as { error?: string }; throw new Error(e.error || 'Upload gagal'); }
    },
    viewInvoice: async (orderId: string): Promise<string> => {
      const res = await authedFetch(`/payments/${orderId}/invoice`);
      if (!res.ok) throw new Error('Gagal memuat file');
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    listUsers: (
      params?: {
        search?: string;
        sort?: 'name' | 'nim' | 'email' | 'created_at' | 'current_semester' | 'salut_status' | 'program';
        dir?: 'asc' | 'desc';
        salut_status?: 'none' | 'pending' | 'approved' | 'rejected' | 'expired';
        is_verified?: 'true' | 'false';
        program_id?: string;
        semester?: string;
        limit?: string;
        offset?: string;
      },
      signal?: AbortSignal,
    ) => {
      const qs = params
        ? new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')) as Record<string, string>
          ).toString()
        : '';
      return apiFetch<AdminUserListResponseDTO>(`/users/admin/all${qs ? '?' + qs : ''}`, { signal });
    },
    updateUserSalut: (userId: string, is_salut: boolean) =>
      apiFetch<AdminUserDTO>(`/users/admin/${userId}/salut`, {
        method: 'PATCH',
        body: JSON.stringify({ is_salut }),
      }),
    bulkUpdateUserSalut: (userIds: string[], is_salut: boolean) =>
      apiFetch<{ updated: number }>('/users/admin/salut/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ userIds, is_salut }),
      }),
    listSalutApplications: (status?: 'pending' | 'all') =>
      apiFetch<AdminSalutApplicationDTO[]>(`/users/admin/salut/applications${status === 'all' ? '?status=all' : ''}`),
    getSalutProofUrl: (userId: string) =>
      apiFetch<{ signedUrl: string }>(`/users/admin/salut/proof-url/${userId}`),
    approveSalut: (userId: string) =>
      apiFetch(`/users/admin/${userId}/salut/approve`, { method: 'PATCH' }),
    rejectSalut: (userId: string, reason: string) =>
      apiFetch(`/users/admin/${userId}/salut/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
    listSksPayments: (status?: 'pending' | 'all') =>
      apiFetch<AdminSksPaymentDTO[]>(`/sks-payment/admin/all${status === 'all' ? '?status=all' : ''}`),
    getSksSlipUrl: (id: string) =>
      apiFetch<{ signedUrl: string }>(`/sks-payment/admin/${id}/slip-url`),
    getSksProofUrl: (id: string) =>
      apiFetch<{ signedUrl: string }>(`/sks-payment/admin/${id}/proof-url`),
    completeSks: (id: string) =>
      apiFetch<SksPaymentDTO>(`/sks-payment/admin/${id}/complete`, { method: 'PATCH' }),
    rejectSks: (id: string, reason: string) =>
      apiFetch<SksPaymentDTO>(`/sks-payment/admin/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  },
};
