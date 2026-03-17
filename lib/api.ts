const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ut_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

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
      apiFetch<{ token: string; refreshToken: string; user: { id: string; email: string } }>(
        '/auth/login', { method: 'POST', body: JSON.stringify(body) }
      ),
    logout: () => apiFetch('/auth/logout', { method: 'POST' }),
    getMe: () => apiFetch('/auth/me'),
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
  },
  packages: {
    list: (programId?: string, semester?: number) => {
      const params = new URLSearchParams();
      if (programId) params.set('programId', programId);
      if (semester) params.set('semester', String(semester));
      return apiFetch(`/packages?${params}`);
    },
    get: (id: string) => apiFetch(`/packages/${id}`),
  },
  cart: {
    get: () => apiFetch('/cart'),
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
      apiFetch('/orders/checkout', { method: 'POST', body: JSON.stringify(body) }),
    list: () => apiFetch('/orders'),
    get: (id: string) => apiFetch(`/orders/${id}`),
    cancel: (id: string) => apiFetch(`/orders/${id}/cancel`, { method: 'POST' }),
  },
  payments: {
    getStatus: (orderId: string) => apiFetch(`/payments/${orderId}`),
  },
  scraper: {
    run: () => apiFetch('/scraper/run', { method: 'POST' }),
    getRuns: () => apiFetch('/scraper/runs'),
    getRun: (id: string) => apiFetch(`/scraper/runs/${id}`),
  },
  admin: {
    listOrders: () => apiFetch('/orders/admin/all'),
    confirmPayment: (orderId: string) =>
      apiFetch(`/payments/${orderId}/confirm`, { method: 'POST' }),
  },
};
