import type { Page, Route } from '@playwright/test';

// Fulfils the backend contract in the browser, so the acceptance suite can run
// without a database. The bodies describe the same contract the MSW handlers
// use, kept deliberately small: these tests assert what a person can do, not
// what the API returns.

const FEES = {
  salutMembership: {
    currency: 'NTD',
    new: 1700,
    returning: 1200,
    rule: 'new = current_semester === 1',
    new_display: 'NT$ 1,700',
    returning_display: 'NT$ 1,200',
    new_display_idr: 'Rp 952.000',
    returning_display_idr: 'Rp 672.000',
    new_label: 'NT$ 1,700 (semester 1)',
    returning_label: 'NT$ 1,200 (semester 2+)',
    tier_combined_display: 'NT$ 1,700 (semester 1) atau NT$ 1,200 (semester 2+)',
    renewalPolicy: { resetMonth: 5, resetDay: 1, timezone: 'Asia/Taipei', notice: 'Perpanjangan wajib setiap semester.' },
  },
  serviceFees: [
    { label: 'Ongkir', key: 'shipping', amount: 300000, amount_display: 'Rp 300.000' },
    { label: 'Biaya Box', key: 'box', amount: 100000, amount_display: 'Rp 100.000' },
    { label: 'Biaya Admin', key: 'admin', amount: 25000, amount_display: 'Rp 25.000' },
  ],
  totalServiceFees: 425000,
  totalServiceFees_display: 'Rp 425.000',
  serviceFeesCurrency: 'IDR',
  paymentBank: { bank: 'BCA', account: '2950211345', holder: 'Nathasya Vira Nerisa' },
};

export const modulePriced = {
  id: 'mod-priced',
  tbo_code: 'MKDU4109',
  name: 'Bahasa Inggris',
  cover_image_url: null,
  price_student: 50000,
  price_general: 60000,
  is_available: true,
  price_student_display: 'Rp 50.000',
};

export const moduleUnpriced = {
  ...modulePriced,
  id: 'mod-unpriced',
  tbo_code: 'PLAC0001',
  name: 'Modul Belum Berharga',
  price_student: 0,
  price_student_display: 'Gratis',
};

export const moduleOutOfStock = {
  ...modulePriced,
  id: 'mod-oos',
  tbo_code: 'OOSK0001',
  name: 'Modul Habis',
  is_available: false,
};

export interface ApiStubs {
  /** Signed-in profile, or null/undefined for a guest. */
  me?: Record<string, unknown> | null;
  modules?: unknown[];
  cart?: Record<string, unknown>;
  salutStatus?: Record<string, unknown>;
  orders?: unknown[];
  /** Extra routes, matched before the defaults. */
  extra?: Record<string, (route: Route) => Promise<void> | void>;
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

export const emptyCart = {
  id: 'cart-1',
  items: [],
  subtotal: 0,
  itemCount: 0,
  hasStaleItems: false,
  subtotal_display: 'Rp 0',
  total_breakdown: {
    subtotal_display: 'Rp 0',
    fee_lines: FEES.serviceFees.map(f => ({ ...f, is_waived: false })),
    unique_code_display: null,
    total_display: 'Rp 425.000',
  },
};

export async function stubApi(page: Page, stubs: ApiStubs = {}) {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api/, '');

    if (path === '/config/fees') return json(route, FEES);
    if (path === '/config/banks') return json(route, { banks: [] });
    if (path === '/config/chat-widget') {
      return json(route, { greeting: { enabled: false, text: '', showDelayMs: 0, autoHideMs: 0 } });
    }

    if (path === '/auth/me') {
      return stubs.me ? json(route, stubs.me) : json(route, { error: 'Unauthorized' }, 401);
    }

    if (path === '/modules') {
      const data = stubs.modules ?? [modulePriced];
      return json(route, { data, total: data.length, page: 1, limit: 24 });
    }
    if (path.startsWith('/modules/')) {
      const data = (stubs.modules ?? [modulePriced]) as { id: string }[];
      const found = data.find(m => m.id === path.split('/')[2]);
      return found ? json(route, found) : json(route, { error: 'Modul tidak ditemukan' }, 404);
    }

    if (path === '/cart') return json(route, stubs.cart ?? emptyCart);
    if (path === '/salut/status') {
      return json(route, stubs.salutStatus ?? { effective_status: 'none', salut_status: 'none', is_member: false, is_pending: false });
    }
    if (path === '/orders') return json(route, stubs.orders ?? []);
    if (path === '/catalog/programs' || path === '/catalog/faculties') return json(route, []);
    if (path === '/products') return json(route, { data: [], total: 0 });
    if (path === '/panduan') return json(route, []);

    return json(route, {});
  });

  // Registered last on purpose: Playwright tries the most recently added
  // handler first, so these override the catch-all above.
  for (const [pattern, handler] of Object.entries(stubs.extra ?? {})) {
    await page.route(pattern, handler);
  }
}

/** Seed the three keys AuthProvider reads on mount, before any script runs. */
export async function signIn(page: Page, token = 'e2e-token') {
  await page.addInitScript(([t]) => {
    localStorage.setItem('ut_token', t);
    localStorage.setItem('ut_refresh_token', `${t}-refresh`);
    localStorage.setItem('ut_expires_at', String(Math.floor(Date.now() / 1000) + 3600));
  }, [token]);
}

export const studentProfile = {
  id: 'u-student',
  email: 'budi@example.com',
  name: 'Budi Santoso',
  role: 'student',
  is_salut: false,
  is_salut_active: false,
  salut_status: 'none',
  is_verified: true,
  current_semester: 3,
};

export const memberProfile = {
  ...studentProfile,
  id: 'u-member',
  name: 'Sari Member',
  is_salut: true,
  is_salut_active: true,
  salut_status: 'approved',
  is_member: true,
  current_semester: 1,
};

export const adminProfile = {
  ...studentProfile,
  id: 'u-admin',
  name: 'Admin SALUT',
  role: 'admin',
};
