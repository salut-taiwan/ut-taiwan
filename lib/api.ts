import type { CartDTO, OrderDTO, ScraperRunDTO, UserProfileDTO } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ut_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ut_refresh_token');
}

// Callback set by AuthContext to signal that the session is fully expired
export let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(cb: (() => void) | null) {
  onSessionExpired = cb;
}

let isRefreshing = false;

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

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await attemptRefresh();
      isRefreshing = false;

      if (refreshed) {
        // Retry with the new token
        const newToken = getToken();
        const retryHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
          ...(options.headers || {}),
        };
        const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers: retryHeaders });
        if (retryRes.ok) return retryRes.json();
      }

      onSessionExpired?.();
    }
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
    register: (body: { email: string; password: string; name: string; nim?: string; phone?: string }) =>
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
    getMe: () => apiFetch<UserProfileDTO>('/auth/me'),
    updateMe: (body: Record<string, unknown>) =>
      apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),
  },
  catalog: {
    getFaculties: () => apiFetch('/catalog/faculties'),
    getProgramsByFaculty: (facultyId: string) => apiFetch(`/catalog/faculties/${facultyId}/programs`),
    getPrograms: (facultyId?: string) =>
      apiFetch(`/catalog/programs${facultyId ? `?facultyId=${facultyId}` : ''}`),
    getProgram: (id: string) => apiFetch(`/catalog/programs/${id}`),
    getSubjects: (programId: string, semester?: number) =>
      apiFetch(`/catalog/programs/${programId}/subjects${semester ? `?semester=${semester}` : ''}`),
    getSubject: (id: string) => apiFetch(`/catalog/subjects/${id}`),
  },
  modules: {
    list: (page = 1, limit = 20) => apiFetch(`/modules?page=${page}&limit=${limit}`),
    search: (q: string) => apiFetch(`/modules/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => apiFetch(`/modules/${id}`),
    create: (body: object) => apiFetch('/modules', { method: 'POST', body: JSON.stringify(body) }),
  },
  packages: {
    list: (programId?: string, semester?: number) => {
      const params = new URLSearchParams();
      if (programId) params.set('programId', programId);
      if (semester) params.set('semester', String(semester));
      return apiFetch(`/packages?${params}`);
    },
    get: (id: string) => apiFetch(`/packages/${id}`),
    sync: () => apiFetch<{ linked: number; packages: number }>('/packages/sync', { method: 'POST' }),
  },
  cart: {
    get: () => apiFetch<CartDTO>('/cart'),
    addItem: (moduleId: string, quantity = 1) =>
      apiFetch('/cart/items', { method: 'POST', body: JSON.stringify({ moduleId, quantity }) }),
    addPackage: (packageId: string) =>
      apiFetch('/cart/packages', { method: 'POST', body: JSON.stringify({ packageId }) }),
    updateItem: (itemId: string, quantity: number) =>
      apiFetch(`/cart/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    removeItem: (itemId: string) =>
      apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' }),
    clear: () => apiFetch('/cart', { method: 'DELETE' }),
  },
  orders: {
    checkout: (body: object) =>
      apiFetch<{ order: OrderDTO }>('/orders/checkout', { method: 'POST', body: JSON.stringify(body) }),
    list: () => apiFetch<OrderDTO[]>('/orders'),
    get: (id: string) => apiFetch<OrderDTO>(`/orders/${id}`),
    cancel: (id: string) => apiFetch(`/orders/${id}/cancel`, { method: 'POST' }),
  },
  payments: {
    getStatus: (orderId: string) => apiFetch(`/payments/${orderId}`),
  },
  scraper: {
    run: () => apiFetch('/scraper/run', { method: 'POST' }),
    getRuns: () => apiFetch<ScraperRunDTO[]>('/scraper/runs'),
    getRun: (id: string) => apiFetch(`/scraper/runs/${id}`),
  },
  admin: {
    listOrders: () => apiFetch<OrderDTO[]>('/orders/admin/all'),
    confirmPayment: (orderId: string) =>
      apiFetch(`/payments/${orderId}/confirm`, { method: 'POST' }),
    updateOrderStatus: (orderId: string, status: string) =>
      apiFetch(`/orders/admin/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
};
