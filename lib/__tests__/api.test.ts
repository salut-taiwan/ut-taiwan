import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

// lib/api.ts holds module-level state (the in-flight refresh), so every test
// imports a fresh copy. Requests are scripted at the fetch layer so the
// interceptor itself is under test rather than mocked away.

const API = 'http://api.test/api';

type Scripted = {
  status?: number;
  body?: unknown;
  ok?: boolean;
  json?: () => Promise<unknown>;
  blob?: () => Promise<Blob>;
};

let calls: { url: string; init: RequestInit }[] = [];

function scriptFetch(responses: Scripted[]) {
  let i = 0;
  const impl = vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const spec = responses[Math.min(i, responses.length - 1)];
    i += 1;
    const status = spec.status ?? 200;
    return {
      ok: spec.ok ?? (status >= 200 && status < 300),
      status,
      statusText: `HTTP ${status}`,
      json: spec.json ?? (async () => spec.body ?? {}),
      blob: spec.blob ?? (async () => new Blob(['bytes'])),
    } as unknown as Response;
  });
  vi.stubGlobal('fetch', impl);
  return impl;
}

async function freshApi() {
  vi.resetModules();
  return import('@/lib/api');
}

function signedIn() {
  localStorage.setItem('ut_token', 'tok-1');
  localStorage.setItem('ut_refresh_token', 'ref-1');
  localStorage.setItem('ut_expires_at', String(Math.floor(Date.now() / 1000) + 3600));
}

beforeEach(() => { calls = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe('apiFetch — request shape', () => {
  test('a signed-in request carries the bearer token and a JSON content type', async () => {
    signedIn();
    scriptFetch([{ body: { ok: true } }]);
    const { api } = await freshApi();

    await api.cart.get();

    const headers = calls[0].init.headers as Record<string, string>;
    expect(calls[0].url).toBe(`${API}/cart`);
    expect(headers.Authorization).toBe('Bearer tok-1');
    expect(headers['Content-Type']).toBe('application/json');
  });

  test('a signed-out request sends no Authorization header at all', async () => {
    scriptFetch([{ body: [] }]);
    const { api } = await freshApi();

    await api.catalog.getFaculties();

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe('apiFetch — 401 handling', () => {
  test('a 401 with no session reads as bad credentials, not an expired session', async () => {
    // Signing in with a wrong password must not tell the user their session
    // ended — they never had one.
    scriptFetch([{ status: 401, body: { error: 'Email atau password salah' } }]);
    const { api } = await freshApi();

    await expect(api.auth.login({ email: 'a@b.c', password: 'wrong' })).rejects.toThrow('Email atau password salah');
    expect(calls).toHaveLength(1);
  });

  test('a 401 with no session never triggers a refresh', async () => {
    scriptFetch([{ status: 401, body: { error: 'nope' } }]);
    const { api } = await freshApi();

    await expect(api.auth.login({ email: 'a@b.c', password: 'wrong' })).rejects.toThrow();
    expect(calls.some(c => c.url.includes('/auth/refresh'))).toBe(false);
  });

  test('an expired token is refreshed and the original request retried', async () => {
    signedIn();
    scriptFetch([
      { status: 401, body: { error: 'expired' } },
      { body: { token: 'tok-2', refreshToken: 'ref-2', expiresAt: 1800000000 } },
      { body: { itemCount: 3 } },
    ]);
    const { api } = await freshApi();

    const result = await api.cart.get();

    expect(result).toEqual({ itemCount: 3 });
    expect(localStorage.getItem('ut_token')).toBe('tok-2');
    expect((calls[2].init.headers as Record<string, string>).Authorization).toBe('Bearer tok-2');
  });

  test('a successful refresh announces the new expiry so timers can reschedule', async () => {
    signedIn();
    scriptFetch([
      { status: 401, body: {} },
      { body: { token: 'tok-2', refreshToken: 'ref-2', expiresAt: 1800000000 } },
      { body: {} },
    ]);
    const { api } = await freshApi();
    const events: CustomEvent[] = [];
    window.addEventListener('ut:token-refreshed', e => events.push(e as CustomEvent));

    await api.cart.get();

    expect(events).toHaveLength(1);
    expect(events[0].detail.expiresAt).toBe(1800000000);
  });

  test('concurrent 401s share one refresh and all succeed', async () => {
    // The single-flight guard used to be a boolean, so the second request
    // skipped the refresh and reported a dead session even though the token
    // had just been renewed.
    signedIn();
    let refreshes = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
      const target = String(url);
      const auth = (init.headers as Record<string, string> | undefined)?.Authorization;
      if (target.includes('/auth/refresh')) {
        refreshes += 1;
        await new Promise(r => setTimeout(r, 10));
        localStorage.setItem('ut_token', 'tok-2');
        return { ok: true, status: 200, json: async () => ({ token: 'tok-2', refreshToken: 'ref-2', expiresAt: 1 }) } as Response;
      }
      if (auth === 'Bearer tok-1') {
        return { ok: false, status: 401, statusText: 'x', json: async () => ({}) } as Response;
      }
      return { ok: true, status: 200, json: async () => ({ ok: target }) } as Response;
    }));
    const { api } = await freshApi();

    const [a, b] = await Promise.all([api.cart.get(), api.orders.list()]);

    expect(refreshes).toBe(1);
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });

  test('a refresh that fails ends the session exactly once', async () => {
    signedIn();
    scriptFetch([
      { status: 401, body: {} },
      { status: 401, body: {} },
    ]);
    const { api, setOnSessionExpired } = await freshApi();
    const expired = vi.fn();
    setOnSessionExpired(expired);

    await expect(api.cart.get()).rejects.toThrow('Sesi berakhir. Silakan login kembali.');
    expect(expired).toHaveBeenCalledTimes(1);
  });

  test('with no refresh token stored, the session ends immediately', async () => {
    localStorage.setItem('ut_token', 'tok-1');
    scriptFetch([{ status: 401, body: {} }]);
    const { api, setOnSessionExpired } = await freshApi();
    const expired = vi.fn();
    setOnSessionExpired(expired);

    await expect(api.cart.get()).rejects.toThrow('Sesi berakhir');
    expect(expired).toHaveBeenCalledOnce();
    expect(calls.some(c => c.url.includes('/auth/refresh'))).toBe(false);
  });

  test('a server error after a successful refresh reports itself, not a false expiry', async () => {
    // The retry succeeded in renewing the token; a 500 on the retried request
    // is the endpoint's problem and must read that way.
    signedIn();
    scriptFetch([
      { status: 401, body: {} },
      { body: { token: 'tok-2', refreshToken: 'ref-2', expiresAt: 1 } },
      { status: 500, body: { error: 'Stok habis' } },
    ]);
    const { api, setOnSessionExpired } = await freshApi();
    const expired = vi.fn();
    setOnSessionExpired(expired);

    await expect(api.cart.get()).rejects.toThrow('Stok habis');
    expect(expired).not.toHaveBeenCalled();
  });

  test('a later 401 can refresh again — the guard resets', async () => {
    signedIn();
    scriptFetch([
      { status: 401, body: {} },
      { body: { token: 'tok-2', refreshToken: 'ref-2', expiresAt: 1 } },
      { body: { first: true } },
      { status: 401, body: {} },
      { body: { token: 'tok-3', refreshToken: 'ref-3', expiresAt: 1 } },
      { body: { second: true } },
    ]);
    const { api } = await freshApi();

    await api.cart.get();
    const second = await api.cart.get();

    expect(second).toEqual({ second: true });
    expect(localStorage.getItem('ut_token')).toBe('tok-3');
  });
});

describe('apiFetch — error mapping', () => {
  test('a server error message is surfaced verbatim', async () => {
    scriptFetch([{ status: 400, body: { error: 'Keranjang kosong' } }]);
    const { api } = await freshApi();
    await expect(api.catalog.getFaculties()).rejects.toThrow('Keranjang kosong');
  });

  test('an unparseable error body falls back to the status text', async () => {
    scriptFetch([{ status: 502, json: async () => { throw new Error('not json'); } }]);
    const { api } = await freshApi();
    await expect(api.catalog.getFaculties()).rejects.toThrow('HTTP 502');
  });
});

describe('upload and download helpers', () => {
  const helpers: [string, (api: Awaited<ReturnType<typeof freshApi>>['api']) => Promise<unknown>][] = [
    ['payments.uploadProof', api => api.payments.uploadProof('o-1', new File(['x'], 'a.png'))],
    ['payments.viewProof', api => api.payments.viewProof('o-1')],
    ['salut.uploadProof', api => api.salut.uploadProof(new File(['x'], 'a.png'))],
    ['sksPayment.uploadSlip', api => api.sksPayment.uploadSlip(new File(['x'], 'a.pdf'))],
    ['sksPayment.uploadProof', api => api.sksPayment.uploadProof(new File(['x'], 'a.png'))],
    ['admin.uploadInvoice', api => api.admin.uploadInvoice('o-1', new File(['x'], 'a.pdf'))],
    ['admin.viewInvoice', api => api.admin.viewInvoice('o-1')],
  ];

  test.each(helpers)('%s refreshes an expired token instead of failing outright', async (_name, call) => {
    // These used to bypass the interceptor: an expired token produced a bare
    // "Upload gagal" with no refresh and no session-expiry prompt.
    signedIn();
    scriptFetch([
      { status: 401, body: {} },
      { body: { token: 'tok-2', refreshToken: 'ref-2', expiresAt: 1 } },
      { body: { url: 'stored/path.png' } },
    ]);
    const { api } = await freshApi();

    await expect(call(api)).resolves.not.toThrow();
    expect(calls.some(c => c.url.includes('/auth/refresh'))).toBe(true);
  });

  test.each(helpers)('%s ends the session when the refresh fails', async (_name, call) => {
    signedIn();
    scriptFetch([{ status: 401, body: {} }, { status: 401, body: {} }]);
    const { api, setOnSessionExpired } = await freshApi();
    const expired = vi.fn();
    setOnSessionExpired(expired);

    await expect(call(api)).rejects.toThrow('Sesi berakhir');
    expect(expired).toHaveBeenCalled();
  });

  test('an upload sends the file without forcing a JSON content type', async () => {
    // Setting one would break the multipart boundary the browser generates.
    signedIn();
    scriptFetch([{ body: { url: 'x' } }]);
    const { api } = await freshApi();

    await api.salut.uploadProof(new File(['x'], 'bukti.png', { type: 'image/png' }));

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(headers.Authorization).toBe('Bearer tok-1');
    expect(calls[0].init.body).toBeInstanceOf(FormData);
  });

  test('the SALUT proof uses its own field name', async () => {
    // The backend reads `proof` here and `file` everywhere else; a swap is a
    // silent 400.
    signedIn();
    scriptFetch([{ body: { url: 'x' } }]);
    const { api } = await freshApi();

    await api.salut.uploadProof(new File(['x'], 'a.png'));

    expect((calls[0].init.body as FormData).get('proof')).toBeInstanceOf(File);
  });

  test('every other upload uses the `file` field', async () => {
    signedIn();
    scriptFetch([{ body: { url: 'x' } }]);
    const { api } = await freshApi();

    await api.sksPayment.uploadSlip(new File(['x'], 'a.pdf'));

    expect((calls[0].init.body as FormData).get('file')).toBeInstanceOf(File);
  });

  test('viewing a document yields an object URL for the browser to open', async () => {
    signedIn();
    scriptFetch([{ body: {} }]);
    const { api } = await freshApi();

    const url = await api.payments.viewProof('o-1');

    expect(url).toMatch(/^blob:/);
  });

  test('a failed download reports a load error', async () => {
    signedIn();
    scriptFetch([{ status: 404, body: {} }]);
    const { api } = await freshApi();

    await expect(api.payments.viewProof('o-1')).rejects.toThrow('Gagal memuat file');
  });
});

describe('query building', () => {
  test('empty and undefined parameters are dropped rather than sent blank', async () => {
    scriptFetch([{ body: { rows: [] } }]);
    const { api } = await freshApi();

    await api.packages.list({ programId: undefined, search: '', limit: '10' });

    expect(calls[0].url).not.toContain('programId');
    expect(calls[0].url).not.toContain('search');
    expect(calls[0].url).toContain('limit=10');
  });

  test('an abort signal is passed through so a stale search can be cancelled', async () => {
    scriptFetch([{ body: {} }]);
    const { api } = await freshApi();
    const controller = new AbortController();

    await api.sksPayment.quote(5600, controller.signal);

    expect(calls[0].init.signal).toBe(controller.signal);
  });
});

describe('session helpers', () => {
  test('the stored expiry is read back as a number', async () => {
    localStorage.setItem('ut_expires_at', '1800000000');
    const { getExpiresAt } = await freshApi();
    expect(getExpiresAt()).toBe(1800000000);
  });

  test('no stored expiry reads as null', async () => {
    const { getExpiresAt } = await freshApi();
    expect(getExpiresAt()).toBeNull();
  });
});

// Every endpoint wrapper, one row each. These are thin, but a wrong path or a
// wrong verb is a real outage that no other tier catches: the backend routes
// live in a different repo, so nothing else compares the two. A row failing
// here means the frontend is calling something the backend does not serve.
//
// Paths are written without the /api prefix, which apiFetch adds.
type Api = (typeof import('@/lib/api'))['api'];

const ENDPOINTS: [name: string, call: (api: Api) => unknown, method: string, path: string, body?: unknown][] = [
  ['auth.register', a => a.auth.register({ email: 'a@b.c', password: 'p', name: 'N', program_id: 'p-1', current_semester: 1, address_zh_city: 'c', address_zh_district: 'd', address_zh_road: 'r', address_zh_number: '1' }), 'POST', '/auth/register'],
  ['auth.login', a => a.auth.login({ email: 'a@b.c', password: 'p' }), 'POST', '/auth/login', { email: 'a@b.c', password: 'p' }],
  ['auth.refresh', a => a.auth.refresh({ refreshToken: 'r' }), 'POST', '/auth/refresh', { refreshToken: 'r' }],
  ['auth.logout', a => a.auth.logout(), 'POST', '/auth/logout'],
  ['auth.resendVerification', a => a.auth.resendVerification('a@b.c'), 'POST', '/auth/resend-verification', { email: 'a@b.c' }],
  ['auth.getMe', a => a.auth.getMe(), 'GET', '/auth/me'],
  ['auth.updateMe', a => a.auth.updateMe({ name: 'Baru' }), 'PUT', '/auth/me', { name: 'Baru' }],

  ['catalog.getFaculties', a => a.catalog.getFaculties(), 'GET', '/catalog/faculties'],
  ['catalog.getProgramsByFaculty', a => a.catalog.getProgramsByFaculty('f-1'), 'GET', '/catalog/faculties/f-1/programs'],
  ['catalog.getPrograms (unfiltered)', a => a.catalog.getPrograms(), 'GET', '/catalog/programs'],
  ['catalog.getPrograms (by faculty)', a => a.catalog.getPrograms('f-1'), 'GET', '/catalog/programs?facultyId=f-1'],
  ['catalog.getPrograms (by code)', a => a.catalog.getPrograms(undefined, 'FE'), 'GET', '/catalog/programs?facultyCode=FE'],
  ['catalog.getProgram', a => a.catalog.getProgram('p-1'), 'GET', '/catalog/programs/p-1'],
  ['catalog.getSubjects', a => a.catalog.getSubjects('p-1'), 'GET', '/catalog/programs/p-1/subjects'],
  ['catalog.getSubjects (by semester)', a => a.catalog.getSubjects('p-1', 3), 'GET', '/catalog/programs/p-1/subjects?semester=3'],
  ['catalog.getSubject', a => a.catalog.getSubject('s-1'), 'GET', '/catalog/subjects/s-1'],

  ['modules.list', a => a.modules.list(), 'GET', '/modules?page=1&limit=20'],
  ['modules.list (paged)', a => a.modules.list(3, 50), 'GET', '/modules?page=3&limit=50'],
  ['modules.search', a => a.modules.search('bahasa indonesia'), 'GET', '/modules/search?q=bahasa%20indonesia'],
  ['modules.get', a => a.modules.get('m-1'), 'GET', '/modules/m-1'],
  ['modules.create', a => a.modules.create({ tbo_code: 'X' }), 'POST', '/modules', { tbo_code: 'X' }],

  ['packages.list', a => a.packages.list(), 'GET', '/packages'],
  ['packages.get', a => a.packages.get('pk-1'), 'GET', '/packages/pk-1'],
  ['packages.sync', a => a.packages.sync(), 'POST', '/packages/sync'],

  ['cart.get', a => a.cart.get(), 'GET', '/cart'],
  ['cart.addItem', a => a.cart.addItem('m-1'), 'POST', '/cart/items', { moduleId: 'm-1', quantity: 1 }],
  ['cart.addItem (quantity)', a => a.cart.addItem('m-1', 4), 'POST', '/cart/items', { moduleId: 'm-1', quantity: 4 }],
  ['cart.addPackage', a => a.cart.addPackage('pk-1'), 'POST', '/cart/packages', { packageId: 'pk-1' }],
  ['cart.addMerch', a => a.cart.addMerch('sku-1', 2), 'POST', '/cart/merch', { skuId: 'sku-1', quantity: 2 }],
  ['cart.updateItem', a => a.cart.updateItem('i-1', 3), 'PUT', '/cart/items/i-1', { quantity: 3 }],
  ['cart.convertToRequest', a => a.cart.convertToRequest('i-1'), 'PATCH', '/cart/items/i-1/convert-to-request'],
  ['cart.removeItem', a => a.cart.removeItem('i-1'), 'DELETE', '/cart/items/i-1'],
  ['cart.clear', a => a.cart.clear(), 'DELETE', '/cart'],

  ['orders.checkout', a => a.orders.checkout({ address: 'x' }), 'POST', '/orders/checkout', { address: 'x' }],
  ['orders.list', a => a.orders.list(), 'GET', '/orders'],
  ['orders.get', a => a.orders.get('o-1'), 'GET', '/orders/o-1'],
  ['orders.cancel', a => a.orders.cancel('o-1'), 'POST', '/orders/o-1/cancel'],
  ['orders.confirmDelivery', a => a.orders.confirmDelivery('o-1'), 'POST', '/orders/o-1/confirm-delivery'],

  ['payments.getStatus', a => a.payments.getStatus('o-1'), 'GET', '/payments/o-1'],

  ['salut.apply', a => a.salut.apply('https://x/p.jpg', 3, '0912345678'), 'POST', '/salut/apply', { proofUrl: 'https://x/p.jpg', current_semester: 3, wa_number: '0912345678' }],
  ['salut.getStatus', a => a.salut.getStatus(), 'GET', '/salut/status'],

  ['sksPayment.quote', a => a.sksPayment.quote(560000), 'POST', '/sks-payment/quote', { idr_amount: 560000 }],
  ['sksPayment.submit', a => a.sksPayment.submit({ nim: '1', name: 'N', semester_period: '2026.1', idr_amount: 1, ut_slip_url: 'u', transfer_proof_url: 't' }), 'POST', '/sks-payment'],
  ['sksPayment.listMine', a => a.sksPayment.listMine(), 'GET', '/sks-payment/mine'],

  ['products.list', a => a.products.list(), 'GET', '/products'],
  ['products.list (by category)', a => a.products.list({ category: 'almet' }), 'GET', '/products?category=almet'],
  ['products.get', a => a.products.get('pr-1'), 'GET', '/products/pr-1'],
  ['products.getClaimCta', a => a.products.getClaimCta('pr-1'), 'GET', '/products/pr-1/claim-cta'],

  ['config.getFees', a => a.config.getFees(), 'GET', '/config/fees'],
  ['config.getBanks', a => a.config.getBanks('NTD'), 'GET', '/config/banks?currency=NTD'],
  ['config.getChatWidget', a => a.config.getChatWidget(), 'GET', '/config/chat-widget'],

  ['scraper.run', a => a.scraper.run(), 'POST', '/scraper/run'],
  ['scraper.runPrefixes', a => a.scraper.runPrefixes(), 'POST', '/scraper/run-prefixes'],
  ['scraper.getRuns', a => a.scraper.getRuns(), 'GET', '/scraper/runs'],
  ['scraper.getRun', a => a.scraper.getRun('r-1'), 'GET', '/scraper/runs/r-1'],

  ['admin.listOrders', a => a.admin.listOrders(), 'GET', '/orders/admin/all'],
  ['admin.confirmPayment', a => a.admin.confirmPayment('o-1'), 'POST', '/payments/o-1/confirm'],
  ['admin.updateOrderStatus', a => a.admin.updateOrderStatus('o-1', 'shipped'), 'PATCH', '/orders/admin/o-1/status', { status: 'shipped' }],
  ['admin.confirmKarunika', a => a.admin.confirmKarunika('o-1'), 'POST', '/orders/admin/o-1/confirm-karunika'],
  ['admin.updateRequestItemStatus', a => a.admin.updateRequestItemStatus('o-1', 'i-1', 'approved', 1700), 'PATCH', '/orders/admin/o-1/items/i-1/request-status', { status: 'approved', unit_price: 1700 }],
  ['admin.updateRequestItemStatus (reject, no price)', a => a.admin.updateRequestItemStatus('o-1', 'i-1', 'rejected'), 'PATCH', '/orders/admin/o-1/items/i-1/request-status', { status: 'rejected' }],
  ['admin.listUsers', a => a.admin.listUsers(), 'GET', '/users/admin/all'],
  ['admin.listUsers (filtered)', a => a.admin.listUsers({ search: 'rina', sort: 'name', dir: 'asc' }), 'GET', '/users/admin/all?search=rina&sort=name&dir=asc'],
  ['admin.updateUserSalut', a => a.admin.updateUserSalut('u-1', true), 'PATCH', '/users/admin/u-1/salut', { is_salut: true }],
  ['admin.bulkUpdateUserSalut', a => a.admin.bulkUpdateUserSalut(['u-1', 'u-2'], false), 'PATCH', '/users/admin/salut/bulk', { userIds: ['u-1', 'u-2'], is_salut: false }],
  ['admin.listSalutApplications', a => a.admin.listSalutApplications(), 'GET', '/users/admin/salut/applications'],
  ['admin.listSalutApplications (all)', a => a.admin.listSalutApplications('all'), 'GET', '/users/admin/salut/applications?status=all'],
  ['admin.getSalutProofUrl', a => a.admin.getSalutProofUrl('u-1'), 'GET', '/users/admin/salut/proof-url/u-1'],
  ['admin.approveSalut', a => a.admin.approveSalut('u-1'), 'PATCH', '/users/admin/u-1/salut/approve'],
  ['admin.rejectSalut', a => a.admin.rejectSalut('u-1', 'bukti tidak jelas'), 'PATCH', '/users/admin/u-1/salut/reject', { reason: 'bukti tidak jelas' }],
  ['admin.listSksPayments', a => a.admin.listSksPayments(), 'GET', '/sks-payment/admin/all'],
  ['admin.listSksPayments (all)', a => a.admin.listSksPayments('all'), 'GET', '/sks-payment/admin/all?status=all'],
  ['admin.getSksSlipUrl', a => a.admin.getSksSlipUrl('s-1'), 'GET', '/sks-payment/admin/s-1/slip-url'],
  ['admin.getSksProofUrl', a => a.admin.getSksProofUrl('s-1'), 'GET', '/sks-payment/admin/s-1/proof-url'],
  ['admin.completeSks', a => a.admin.completeSks('s-1'), 'PATCH', '/sks-payment/admin/s-1/complete'],
  ['admin.rejectSks', a => a.admin.rejectSks('s-1', 'nominal beda'), 'PATCH', '/sks-payment/admin/s-1/reject', { reason: 'nominal beda' }],
];

describe('every endpoint calls the URL and verb it claims', () => {
  test.each(ENDPOINTS)('%s', async (_name, call, method, path, body) => {
    signedIn();
    scriptFetch([{ body: {} }]);
    const { api } = await freshApi();

    await call(api);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${API}${path}`);
    // apiFetch omits `method` for reads, which fetch defaults to GET.
    expect(calls[0].init.method ?? 'GET').toBe(method);
    if (body !== undefined) {
      expect(JSON.parse(calls[0].init.body as string)).toEqual(body);
    }
  });
});
