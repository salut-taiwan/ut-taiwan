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
